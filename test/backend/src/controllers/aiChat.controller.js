const aiChatService = require('../services/aiChat.service');
const { success, error } = require('../utils/response');

/**
 * 修复 API URL
 * 当检测到局域网 IP + 本地代理端口时，转换回 127.0.0.1
 * 因为后端代理运行在服务器本机，应该连接本机的代理服务
 */
const fixProxyUrl = (url) => {
  try {
    const urlObj = new URL(url);
    // 如果是局域网地址（10.x.x.x, 192.168.x.x, 172.16-31.x.x）连接到常见代理端口
    // 则认为是本机代理，转换回 127.0.0.1
    const localProxyPorts = ['8045', '8080', '8000', '3000'];
    const isPrivateIP = /^(10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[01])\.)/.test(urlObj.hostname);
    
    if (isPrivateIP && localProxyPorts.includes(urlObj.port)) {
      urlObj.hostname = '127.0.0.1';
      return urlObj.toString();
    }
    return url;
  } catch {
    return url;
  }
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

module.exports = {
  getCharacters,
  getCharacterById,
  createCharacter,
  updateCharacter,
  deleteCharacter,
  getConversations,
  createConversation,
  deleteConversation,
  getMessages,
  sendMessage,
  saveAssistantMessage,
  proxyAIRequest
};

