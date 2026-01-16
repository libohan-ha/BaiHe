const aiGroupChatService = require('../services/aiGroupChat.service');
const { success, error } = require('../utils/response');

/**
 * 修复 API URL
 */
const fixProxyUrl = (url) => {
  try {
    const urlObj = new URL(url);
    const localProxyPorts = ['8045', '8080', '8000', '8317'];
    const isPrivateIP = /^(10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[01])\.)/.test(urlObj.hostname);
    const isLocalhost = urlObj.hostname === '127.0.0.1' || urlObj.hostname === 'localhost';
    const isDocker = process.env.NODE_ENV === 'production' || process.env.DOCKER_ENV === 'true';

    if (isDocker) {
      if ((isLocalhost || isPrivateIP) && localProxyPorts.includes(urlObj.port)) {
        urlObj.hostname = 'host.docker.internal';
        return urlObj.toString();
      }
    } else {
      if (isPrivateIP && localProxyPorts.includes(urlObj.port)) {
        urlObj.hostname = '127.0.0.1';
        return urlObj.toString();
      }
    }
    return url;
  } catch {
    return url;
  }
};

// ============ 群聊对话管理 ============

/**
 * 创建群聊对话（不需要主角色ID）
 */
const createGroupConversation = async (req, res, next) => {
  try {
    const { title, memberIds } = req.body;
    const conversation = await aiGroupChatService.createGroupConversation(
      req.user.id, title, memberIds || []
    );
    res.status(201).json(success(conversation, '创建群聊成功'));
  } catch (err) {
    next(err);
  }
};

/**
 * 获取当前用户的所有群聊对话列表
 */
const getGroupConversations = async (req, res, next) => {
  try {
    const result = await aiGroupChatService.getGroupConversations(req.user.id);
    res.json(success(result, '获取成功'));
  } catch (err) {
    next(err);
  }
};

/**
 * 删除群聊对话
 */
const deleteGroupConversation = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const result = await aiGroupChatService.deleteGroupConversation(conversationId, req.user.id);
    res.json(success(result, '删除成功'));
  } catch (err) {
    next(err);
  }
};

/**
 * 更新群聊标题
 */
const updateGroupConversationTitle = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const { title } = req.body;
    if (!title) {
      return res.status(400).json(error('标题不能为空', 400));
    }
    const result = await aiGroupChatService.updateGroupConversationTitle(conversationId, title, req.user.id);
    res.json(success(result, '更新成功'));
  } catch (err) {
    next(err);
  }
};

const getGroupMembers = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const result = await aiGroupChatService.getGroupMembers(conversationId, req.user.id);
    res.json(success(result, '获取成功'));
  } catch (err) {
    next(err);
  }
};

const addGroupMember = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const { aiCharacterId } = req.body;
    if (!aiCharacterId) {
      return res.status(400).json(error('AI角色ID不能为空', 400));
    }
    const member = await aiGroupChatService.addGroupMember(conversationId, aiCharacterId, req.user.id);
    res.status(201).json(success(member, '添加成员成功'));
  } catch (err) {
    next(err);
  }
};

const removeGroupMember = async (req, res, next) => {
  try {
    const { conversationId, aiCharacterId } = req.params;
    const result = await aiGroupChatService.removeGroupMember(conversationId, aiCharacterId, req.user.id);
    res.json(success(result, '移除成员成功'));
  } catch (err) {
    next(err);
  }
};

const getGroupMessages = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const result = await aiGroupChatService.getGroupMessages(conversationId, req.user.id);
    res.json(success(result, '获取成功'));
  } catch (err) {
    next(err);
  }
};

const sendGroupMessage = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const { content, images } = req.body;
    if (!content) {
      return res.status(400).json(error('消息内容不能为空', 400));
    }
    const message = await aiGroupChatService.sendGroupMessage(conversationId, content, req.user.id, images || []);
    res.json(success(message, '发送成功'));
  } catch (err) {
    next(err);
  }
};

/**
 * 群聊AI回复 - SSE流式响应，多个AI并行回复
 */
const groupChatWithAI = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const { apiConfigs } = req.body;

    if (!apiConfigs || typeof apiConfigs !== 'object') {
      return res.status(400).json(error('API配置不能为空', 400));
    }

    const { messages: contextMessages, members } = await aiGroupChatService.getGroupChatContext(
      conversationId, req.user.id, 100
    );

    const userDisplayName = req.user?.username || '用户';

    if (members.length === 0) {
      return res.status(400).json(error('群聊中没有AI成员', 400));
    }

    // 设置SSE响应头
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    const aiList = members.map(m => ({
      id: m.aiCharacter.id,
      name: m.aiCharacter.name,
      avatarUrl: m.aiCharacter.avatarUrl,
      order: m.order
    }));

    res.write('event: init\n');
    res.write('data: ' + JSON.stringify({ members: aiList }) + '\n\n');

    // 并行调用所有AI
    const aiPromises = members.map(async (member) => {
      const character = member.aiCharacter;
      const config = apiConfigs[character.id];

      if (!config || !config.apiUrl || !config.apiKey || !config.model) {
        res.write('event: ai_error\n');
        res.write('data: ' + JSON.stringify({
          aiCharacterId: character.id,
          aiName: character.name,
          error: 'API配置缺失'
        }) + '\n\n');
        return { aiCharacterId: character.id, success: false, error: 'API配置缺失' };
      }

      try {
        const fixedUrl = fixProxyUrl(config.apiUrl);
        console.log('[GroupChat] 调用AI:', character.name, 'URL:', fixedUrl);

        const formattedMessages = aiGroupChatService.formatGroupMessagesForAI(
          contextMessages,
          character.name,
          userDisplayName
        );

        const systemPrompt =
          (character.prompt || '你是一个友好的AI助手。') +
          '\n\n' +
          '你正在参与一个多AI群聊。\n' +
          `你可以看到群聊历史：用户消息格式为 [${userDisplayName}]: ...，其他AI消息格式为 [AI名]: ...。\n` +
          '注意：本轮是并行回复，你不会看到其他AI本轮的新回复；只能在下一轮从历史中看到他们已保存的发言。\n' +
          '请基于历史消息自然对话，不要声称你“看不到其他AI的消息”，除非历史里确实没有。';

        res.write('event: ai_start\n');
        res.write('data: ' + JSON.stringify({
          aiCharacterId: character.id,
          aiName: character.name,
          avatarUrl: character.avatarUrl,
          order: member.order
        }) + '\n\n');

        const response = await fetch(fixedUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + config.apiKey
          },
          body: JSON.stringify({
            model: config.model,
            messages: [
              { role: 'system', content: systemPrompt },
              ...formattedMessages
            ],
            stream: true
          })
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const errorMsg = errorData.error?.message || 'AI请求失败: ' + response.status;
          res.write('event: ai_error\n');
          res.write('data: ' + JSON.stringify({
            aiCharacterId: character.id,
            aiName: character.name,
            error: errorMsg
          }) + '\n\n');
          return { aiCharacterId: character.id, success: false, error: errorMsg };
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullContent = '';
        const DONE_MARKER = '[' + 'DONE' + ']';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6).trim();
              if (data === DONE_MARKER) continue;

              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices?.[0]?.delta?.content || '';
                if (content) {
                  fullContent += content;
                  res.write('event: ai_stream\n');
                  res.write('data: ' + JSON.stringify({
                    aiCharacterId: character.id,
                    content: content
                  }) + '\n\n');
                }
              } catch {
                // 忽略解析错误
              }
            }
          }
        }

        // 保存AI回复到数据库
        const savedMessage = await aiGroupChatService.saveGroupAIMessage(
          conversationId, fullContent, character.id, req.user.id
        );

        res.write('event: ai_complete\n');
        res.write('data: ' + JSON.stringify({
          aiCharacterId: character.id,
          aiName: character.name,
          message: savedMessage
        }) + '\n\n');

        console.log('[GroupChat] AI回复完成:', character.name);
        return { aiCharacterId: character.id, success: true, content: fullContent };

      } catch (err) {
        console.error('[GroupChat] AI调用失败:', character.name, err);
        res.write('event: ai_error\n');
        res.write('data: ' + JSON.stringify({
          aiCharacterId: character.id,
          aiName: character.name,
          error: err.message || 'AI回复失败'
        }) + '\n\n');
        return { aiCharacterId: character.id, success: false, error: err.message };
      }
    });

    // 等待所有AI完成
    await Promise.all(aiPromises);

    // 发送完成事件
    res.write('event: done\n');
    res.write('data: ' + JSON.stringify({ message: '所有AI回复完成' }) + '\n\n');
    res.end();

  } catch (err) {
    console.error('[GroupChat] 群聊AI回复失败:', err);
    if (!res.headersSent) {
      next(err);
    } else {
      res.write('event: error\n');
      res.write('data: ' + JSON.stringify({ error: err.message }) + '\n\n');
      res.end();
    }
  }
};

module.exports = {
  createGroupConversation,
  getGroupConversations,
  deleteGroupConversation,
  updateGroupConversationTitle,
  getGroupMembers,
  addGroupMember,
  removeGroupMember,
  getGroupMessages,
  sendGroupMessage,
  groupChatWithAI
};
