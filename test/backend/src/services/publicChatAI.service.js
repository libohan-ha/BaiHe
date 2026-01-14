const prisma = require('../models/prisma');

const STREAM_DONE_MARKER = '[' + 'DONE' + ']';

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

const generateTempId = () => {
  return 'temp_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
};

const getRecentMessages = async (limit = 100) => {
  const messages = await prisma.publicChatMessage.findMany({
    take: limit,
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: { id: true, username: true } },
      aiCharacter: { select: { id: true, name: true } }
    }
  });
  return messages.reverse();
};

const formatMessagesForAI = (messages, userMessage) => {
  const formatted = messages.map(msg => {
    if (msg.aiCharacterId) {
      return { role: 'assistant', content: msg.content };
    } else {
      const username = msg.user?.username || '未知用户';
      return { role: 'user', content: '[' + username + ']: ' + msg.content };
    }
  });
  formatted.push({ role: 'user', content: userMessage });
  return formatted;
};

const saveAIMessage = async (content, aiCharacterId) => {
  return await prisma.publicChatMessage.create({
    data: { content, aiCharacterId },
    include: {
      aiCharacter: { select: { id: true, name: true, avatarUrl: true } }
    }
  });
};

const validateAICharacterOwnership = async (aiCharacterId, userId) => {
  return await prisma.aICharacter.findFirst({
    where: { id: aiCharacterId, userId: userId }
  });
};

const getAICharacter = async (aiCharacterId) => {
  return await prisma.aICharacter.findUnique({
    where: { id: aiCharacterId }
  });
};

const streamAIResponse = async (io, character, apiConfig, contextMessages, userMessage, username) => {
  const tempId = generateTempId();
  const fixedUrl = fixProxyUrl(apiConfig.url);

  console.log('[PublicChat AI] 调用 AI: ' + character.name + ', URL: ' + fixedUrl);

  io.to('public-room').emit('ai:typing', {
    aiCharacterId: character.id,
    aiName: character.name,
    aiAvatarUrl: character.avatarUrl,
    tempId
  });

  try {
    const messages = formatMessagesForAI(contextMessages, '[' + username + ']: ' + userMessage);

    const response = await fetch(fixedUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + apiConfig.apiKey
      },
      body: JSON.stringify({
        model: apiConfig.model,
        messages: [
          { role: 'system', content: character.prompt || '你是一个友好的AI助手。' },
          ...messages
        ],
        stream: true
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || 'AI请求失败: ' + response.status);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullContent = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6).trim();
          if (data === STREAM_DONE_MARKER) continue;

          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content || '';
            if (content) {
              fullContent += content;
              io.to('public-room').emit('ai:stream', {
                tempId,
                content
              });
            }
          } catch {
            // 忽略解析错误
          }
        }
      }
    }

    // 保存到数据库
    const savedMessage = await saveAIMessage(fullContent, character.id);

    // 广播完成
    io.to('public-room').emit('ai:complete', {
      tempId,
      message: savedMessage
    });

    console.log('[PublicChat AI] AI回复完成: ' + character.name);

  } catch (error) {
    console.error('[PublicChat AI] AI调用失败:', error);
    io.to('public-room').emit('ai:error', {
      tempId,
      error: error.message || 'AI回复失败'
    });
  }
};

module.exports = {
  getRecentMessages,
  saveAIMessage,
  validateAICharacterOwnership,
  getAICharacter,
  streamAIResponse,
  generateTempId
};
