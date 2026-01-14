const aiChatService = require('../services/aiChat.service');
const { success, error } = require('../utils/response');
const fs = require('fs');
const path = require('path');

/**
 * 修复 API URL
 * Docker环境下：所有本地代理端口都转换为 host.docker.internal
 * 非Docker环境下：局域网IP转换为127.0.0.1
 */
const fixProxyUrl = (url) => {
  try {
    const urlObj = new URL(url);
    const localProxyPorts = ['8045', '8080', '8000'];
    const isPrivateIP = /^(10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[01])\.)/.test(urlObj.hostname);
    const isLocalhost = urlObj.hostname === '127.0.0.1' || urlObj.hostname === 'localhost';
    
    // 检测是否在Docker环境中
    const isDocker = process.env.NODE_ENV === 'production' || process.env.DOCKER_ENV === 'true';
    
    if (isDocker) {
      // Docker环境下：所有本地代理端口（127.0.0.1、localhost、局域网IP）都转换为 host.docker.internal
      // 因为代理服务通常只监听 127.0.0.1，Docker容器需要通过 host.docker.internal 访问
      if ((isLocalhost || isPrivateIP) && localProxyPorts.includes(urlObj.port)) {
        urlObj.hostname = 'host.docker.internal';
        return urlObj.toString();
      }
      return url;
    } else {
      // 非Docker环境：局域网IP转换为127.0.0.1
      if (isPrivateIP && localProxyPorts.includes(urlObj.port)) {
        urlObj.hostname = '127.0.0.1';
        return urlObj.toString();
      }
      return url;
    }
  } catch {
    return url;
  }
};

// ============ 多模态图片处理（仅携带最新一条消息图片） ============

const UPLOADS_ROOT = path.join(__dirname, '../../uploads');

const IMAGE_MIME_TYPES = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
};

const toDataUrlFromUpload = async (imageUrl) => {
  if (!imageUrl || typeof imageUrl !== 'string') return null;

  if (imageUrl.startsWith('data:')) return imageUrl;
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) return imageUrl;

  let pathname = imageUrl;
  try {
    pathname = new URL(imageUrl, 'http://localhost').pathname;
  } catch {
    // ignore
  }

  const match = pathname.match(/^\/uploads\/([^/]+)\/([^/]+)$/);
  if (!match) return null;

  const folder = match[1];
  const filename = match[2];

  const allowedFolders = new Set(['avatars', 'covers', 'gallery', 'chat']);
  if (!allowedFolders.has(folder)) return null;

  const safeFilename = path.basename(filename);
  if (safeFilename !== filename) return null;

  const ext = path.extname(safeFilename).toLowerCase();
  const mimeType = IMAGE_MIME_TYPES[ext];
  if (!mimeType) return null;

  const baseDir = path.resolve(UPLOADS_ROOT, folder);
  const filePath = path.resolve(baseDir, safeFilename);
  const relativePath = path.relative(baseDir, filePath);
  if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) return null;

  try {
    const buffer = await fs.promises.readFile(filePath);
    const base64 = buffer.toString('base64');
    return `data:${mimeType};base64,${base64}`;
  } catch {
    console.warn('读取图片失败:', pathname);
    return null;
  }
};

const formatContentWithImages = async (content, images) => {
  if (!Array.isArray(images) || images.length === 0) return content;

  const parts = [];
  const text = typeof content === 'string' ? content : String(content ?? '');

  if (text.trim()) {
    parts.push({ type: 'text', text });
  }

  for (const imageUrl of images) {
    const dataUrl = await toDataUrlFromUpload(imageUrl);
    if (dataUrl) {
      parts.push({
        type: 'image_url',
        image_url: { url: dataUrl },
      });
    }
  }

  return parts.length > 0 ? parts : content;
};

const attachLatestMessageImages = async (messages) => {
  if (!Array.isArray(messages) || messages.length === 0) return [];

  const prepared = messages.map(m => ({
    role: m.role,
    content: m.content,
  }));

  const lastIndex = messages.length - 1;
  const last = messages[lastIndex];

  if (last?.role === 'user' && Array.isArray(last.images) && last.images.length > 0) {
    prepared[lastIndex].content = await formatContentWithImages(last.content, last.images);
  }

  return prepared;
};

// AI API 代理 - 支持流式响应
const proxyAIRequest = async (req, res, next) => {
  try {
    const { apiUrl, apiKey, model, messages, stream = true } = req.body;

    if (!apiUrl || !apiKey || !model || !messages) {
      return res.status(400).json(error('缺少必要参数', 400));
    }

    // 修复 API URL（局域网地址转本地）
    const fixedUrl = fixProxyUrl(apiUrl);
    console.log('AI代理请求:', apiUrl, '->', fixedUrl);

    // 转发请求到 AI API
    const response = await fetch(fixedUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        messages,
        stream
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return res.status(response.status).json(error(errorData.error?.message || 'AI请求失败', response.status));
    }

    // 如果是流式响应，直接转发
    if (stream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          res.write(chunk);
        }
      } finally {
        res.end();
      }
    } else {
      // 非流式响应
      const data = await response.json();
      res.json(success(data, '请求成功'));
    }
  } catch (err) {
    console.error('AI代理请求失败:', err);
    next(err);
  }
};

// ============ AI角色相关 ============

const getCharacters = async (req, res, next) => {
  try {
    const result = await aiChatService.getCharacters(req.user.id);
    res.json(success(result, '获取成功'));
  } catch (err) {
    next(err);
  }
};

const getCharacterById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const character = await aiChatService.getCharacterById(id, req.user.id);
    if (!character) {
      return res.status(404).json(error('角色不存在', 404));
    }
    res.json(success(character, '获取成功'));
  } catch (err) {
    next(err);
  }
};

const createCharacter = async (req, res, next) => {
  try {
    const character = await aiChatService.createCharacter(req.body, req.user.id);
    res.status(201).json(success(character, '创建成功'));
  } catch (err) {
    next(err);
  }
};

const updateCharacter = async (req, res, next) => {
  try {
    const { id } = req.params;
    const character = await aiChatService.updateCharacter(id, req.body, req.user.id);
    if (!character) {
      return res.status(404).json(error('角色不存在', 404));
    }
    res.json(success(character, '更新成功'));
  } catch (err) {
    next(err);
  }
};

const deleteCharacter = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await aiChatService.deleteCharacter(id, req.user.id);
    if (!result) {
      return res.status(404).json(error('角色不存在', 404));
    }
    res.json(success(null, '删除成功'));
  } catch (err) {
    next(err);
  }
};

// ============ 对话相关 ============

const getConversations = async (req, res, next) => {
  try {
    const { characterId } = req.params;
    const result = await aiChatService.getConversations(characterId, req.user.id);
    res.json(success(result, '获取成功'));
  } catch (err) {
    next(err);
  }
};

const createConversation = async (req, res, next) => {
  try {
    const { characterId } = req.params;
    const { title } = req.body;
    const conversation = await aiChatService.createConversation(characterId, req.user.id, title);
    res.status(201).json(success(conversation, '创建成功'));
  } catch (err) {
    next(err);
  }
};

const updateConversation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const conversation = await aiChatService.updateConversation(id, req.body, req.user.id);
    if (!conversation) {
      return res.status(404).json(error('对话不存在', 404));
    }
    res.json(success(conversation, '更新成功'));
  } catch (err) {
    next(err);
  }
};

const deleteConversation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await aiChatService.deleteConversation(id, req.user.id);
    if (!result) {
      return res.status(404).json(error('对话不存在', 404));
    }
    res.json(success(null, '删除成功'));
  } catch (err) {
    next(err);
  }
};

// ============ 消息相关 ============

const getMessages = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const result = await aiChatService.getMessages(conversationId, req.user.id);
    res.json(success(result, '获取成功'));
  } catch (err) {
    next(err);
  }
};

const sendMessage = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const { content, images } = req.body;
    
    // 保存用户消息（支持图片）
    const userMessage = await aiChatService.addMessage(conversationId, content, 'user', req.user.id, images || []);
    
    res.json(success(userMessage, '发送成功'));
  } catch (err) {
    next(err);
  }
};

const saveAssistantMessage = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const { content } = req.body;
    
    // 保存AI回复消息
    const assistantMessage = await aiChatService.addMessage(conversationId, content, 'assistant', req.user.id);
    
    res.json(success(assistantMessage, '保存成功'));
  } catch (err) {
    next(err);
  }
};

// 重新生成AI回复 - 支持流式响应
const regenerateAssistantMessage = async (req, res, next) => {
  try {
    const { conversationId, messageId } = req.params;
    const { apiUrl, apiKey, model } = req.body;

    if (!apiUrl || !apiKey || !model) {
      return res.status(400).json(error('缺少必要参数', 400));
    }

    // 获取该消息之前的历史记录和角色信息
    const { messages, character } = await aiChatService.getMessagesBeforeId(conversationId, messageId, req.user.id);

    // 修复 API URL
    const fixedUrl = fixProxyUrl(apiUrl);
    console.log('重新生成AI回复:', apiUrl, '->', fixedUrl);

    // 仅携带最新一条消息的图片（多模态）
    const preparedMessages = await attachLatestMessageImages(messages);

    // 调用 AI API
    const response = await fetch(fixedUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: character?.prompt || '你是一个友好的AI助手。' },
          ...preparedMessages
        ],
        stream: true
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return res.status(response.status).json(error(errorData.error?.message || 'AI请求失败', response.status));
    }

    // 流式响应
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Message-Id', messageId);

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullContent = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        res.write(chunk);

        // 解析流式响应内容
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();
            if (data === '[DONE]') continue;
            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content || '';
              if (content) {
                fullContent += content;
              }
            } catch {
              // 忽略解析错误
            }
          }
        }
      }
    } finally {
      // 流式响应结束后，更新数据库中的消息内容
      if (fullContent) {
        await aiChatService.updateMessageContent(messageId, fullContent, req.user.id);
      }
      res.end();
    }
  } catch (err) {
    console.error('重新生成AI回复失败:', err);
    next(err);
  }
};

// 编辑消息并重新生成AI回复 - 支持流式响应
const editAndRegenerateMessage = async (req, res, next) => {
  try {
    const { conversationId, messageId } = req.params;
    const { content, apiUrl, apiKey, model } = req.body;

    if (!content || !apiUrl || !apiKey || !model) {
      return res.status(400).json(error('缺少必要参数', 400));
    }

    // 编辑消息并截断历史
    const { messages, character } = await aiChatService.editMessageAndTruncate(messageId, content, req.user.id);

    // 修复 API URL
    const fixedUrl = fixProxyUrl(apiUrl);
    console.log('编辑消息并重新生成AI回复:', apiUrl, '->', fixedUrl);

    // 仅携带最新一条消息的图片（多模态）
    const preparedMessages = await attachLatestMessageImages(messages);

    // 调用 AI API
    const response = await fetch(fixedUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: character?.prompt || '你是一个友好的AI助手。' },
          ...preparedMessages
        ],
        stream: true
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return res.status(response.status).json(error(errorData.error?.message || 'AI请求失败', response.status));
    }

    // 流式响应
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Messages', JSON.stringify(messages.map(m => m.id)));

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullContent = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        res.write(chunk);

        // 解析流式响应内容
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();
            if (data === '[DONE]') continue;
            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content || '';
              if (content) {
                fullContent += content;
              }
            } catch {
              // 忽略解析错误
            }
          }
        }
      }
    } finally {
      // 流式响应结束后，保存AI回复
      if (fullContent) {
        await aiChatService.addMessage(conversationId, fullContent, 'assistant', req.user.id);
      }
      res.end();
    }
  } catch (err) {
    console.error('编辑消息并重新生成失败:', err);
    next(err);
  }
};

module.exports = {
  getCharacters,
  getCharacterById,
  createCharacter,
  updateCharacter,
  deleteCharacter,
  getConversations,
  createConversation,
  updateConversation,
  deleteConversation,
  getMessages,
  sendMessage,
  saveAssistantMessage,
  proxyAIRequest,
  regenerateAssistantMessage,
  editAndRegenerateMessage
};

