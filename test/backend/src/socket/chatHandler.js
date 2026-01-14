const publicChatService = require('../services/publicChat.service');
const publicChatAIService = require('../services/publicChatAI.service');

// 在线用户列表
const onlineUsers = new Map();

module.exports = function chatHandler(io, socket) {
  console.log(`用户连接: ${socket.username} (${socket.userId})`);

  // 加入公共聊天室
  socket.join('public-room');

  // 添加到在线用户列表
  onlineUsers.set(socket.userId, {
    id: socket.userId,
    username: socket.username,
    avatarUrl: socket.avatarUrl
  });

  // 广播用户加入
  io.to('public-room').emit('user:join', {
    userId: socket.userId,
    username: socket.username,
    onlineCount: onlineUsers.size
  });

  // 发送在线用户列表给新连接的用户
  socket.emit('users:online', Array.from(onlineUsers.values()));

  // 接收普通消息
  socket.on('message:send', async (data) => {
    try {
      const { content, imageUrl } = data;
      if (!content?.trim() && !imageUrl) return;

      const message = await publicChatService.createMessage({
        content: content?.trim() || '',
        imageUrl,
        userId: socket.userId
      });

      io.to('public-room').emit('message:new', message);
    } catch (error) {
      console.error('发送消息失败:', error);
      socket.emit('message:error', { message: '发送消息失败' });
    }
  });

  // 接收带 AI @ 的消息
  socket.on('ai:request', async (data) => {
    try {
      const { content, imageUrl, mentionedAIs, apiConfigs } = data;

      if (!content?.trim() && !imageUrl) return;
      if (!mentionedAIs || mentionedAIs.length === 0) return;

      // 1. 保存用户消息到数据库
      const userMessage = await publicChatService.createMessage({
        content: content?.trim() || '',
        imageUrl,
        userId: socket.userId
      });

      // 2. 广播用户消息给所有人
      io.to('public-room').emit('message:new', userMessage);

      // 3. 获取上下文消息
      const contextMessages = await publicChatAIService.getRecentMessages(100);

      // 4. 对每个 AI 并发调用
      const aiPromises = mentionedAIs.map(async (ai) => {
        const character = await publicChatAIService.validateAICharacterOwnership(ai.id, socket.userId);
        if (!character) {
          socket.emit('ai:error', { tempId: null, error: 'AI 不存在或不属于你' });
          return;
        }

        const apiConfig = apiConfigs[ai.id];
        if (!apiConfig || !apiConfig.apiKey) {
          socket.emit('ai:error', { tempId: null, error: '请先配置 API Key' });
          return;
        }

        await publicChatAIService.streamAIResponse(
          io, character, apiConfig, contextMessages, content?.trim() || '', socket.username
        );
      });

      await Promise.allSettled(aiPromises);
    } catch (error) {
      console.error('AI请求失败:', error);
      socket.emit('ai:error', { tempId: null, error: error.message || 'AI请求失败' });
    }
  });

  // 断开连接
  socket.on('disconnect', () => {
    console.log(`用户断开: ${socket.username} (${socket.userId})`);
    onlineUsers.delete(socket.userId);
    io.to('public-room').emit('user:leave', {
      userId: socket.userId,
      username: socket.username,
      onlineCount: onlineUsers.size
    });
  });
};
