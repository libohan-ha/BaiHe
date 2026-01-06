const prisma = require('../models/prisma');

const createError = (statusCode, message) => {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
};

// ============ AI角色相关 ============

const getCharacters = async (userId) => {
  const characters = await prisma.aICharacter.findMany({
    where: { userId },
    orderBy: { updatedAt: 'desc' },
    include: {
      _count: {
        select: { conversations: true }
      }
    }
  });
  return { characters };
};

const getCharacterById = async (id, userId) => {
  const character = await prisma.aICharacter.findFirst({
    where: { id, userId }
  });
  return character;
};

const createCharacter = async (data, userId) => {
  const { name, avatarUrl, userAvatarUrl, prompt, backgroundUrl, modelName, bubbleOpacity } = data;
  
  const character = await prisma.aICharacter.create({
    data: {
      name,
      avatarUrl,
      userAvatarUrl,
      prompt,
      backgroundUrl,
      modelName: modelName || 'deepseek-chat',
      bubbleOpacity: bubbleOpacity ?? 85,
      userId
    }
  });
  return character;
};

const updateCharacter = async (id, data, userId) => {
  const character = await prisma.aICharacter.findFirst({
    where: { id, userId }
  });
  
  if (!character) {
    return null;
  }
  
  const { name, avatarUrl, userAvatarUrl, prompt, backgroundUrl, modelName, bubbleOpacity } = data;
  
  const updateData = {};
  if (name !== undefined) updateData.name = name;
  if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl;
  if (userAvatarUrl !== undefined) updateData.userAvatarUrl = userAvatarUrl;
  if (prompt !== undefined) updateData.prompt = prompt;
  if (backgroundUrl !== undefined) updateData.backgroundUrl = backgroundUrl;
  if (modelName !== undefined) updateData.modelName = modelName;
  if (bubbleOpacity !== undefined) updateData.bubbleOpacity = bubbleOpacity;
  
  const updated = await prisma.aICharacter.update({
    where: { id },
    data: updateData
  });
  return updated;
};

const deleteCharacter = async (id, userId) => {
  const character = await prisma.aICharacter.findFirst({
    where: { id, userId }
  });
  
  if (!character) {
    return null;
  }
  
  await prisma.aICharacter.delete({ where: { id } });
  return { id };
};

// ============ 对话相关 ============

const getConversations = async (characterId, userId) => {
  const conversations = await prisma.conversation.findMany({
    where: { characterId, userId },
    orderBy: { updatedAt: 'desc' },
    include: {
      _count: {
        select: { messages: true }
      }
    }
  });
  return { conversations };
};

const createConversation = async (characterId, userId, title) => {
  // 验证角色属于当前用户
  const character = await prisma.aICharacter.findFirst({
    where: { id: characterId, userId }
  });
  
  if (!character) {
    throw createError(404, '角色不存在');
  }
  
  const conversation = await prisma.conversation.create({
    data: {
      title: title || '新对话',
      characterId,
      userId
    }
  });
  return conversation;
};

const updateConversation = async (id, data, userId) => {
  const conversation = await prisma.conversation.findFirst({
    where: { id, userId }
  });
  
  if (!conversation) {
    return null;
  }
  
  const { title } = data;
  const updateData = {};
  if (title !== undefined) updateData.title = title;
  
  const updated = await prisma.conversation.update({
    where: { id },
    data: updateData
  });
  return updated;
};

const deleteConversation = async (id, userId) => {
  const conversation = await prisma.conversation.findFirst({
    where: { id, userId }
  });
  
  if (!conversation) {
    return null;
  }
  
  await prisma.conversation.delete({ where: { id } });
  return { id };
};

// ============ 消息相关 ============

const getMessages = async (conversationId, userId) => {
  // 验证对话属于当前用户
  const conversation = await prisma.conversation.findFirst({
    where: { id: conversationId, userId }
  });
  
  if (!conversation) {
    throw createError(404, '对话不存在');
  }
  
  const messages = await prisma.chatMessage.findMany({
    where: { conversationId },
    orderBy: { createdAt: 'asc' }
  });
  return { messages };
};

const addMessage = async (conversationId, content, role, userId, images = []) => {
  // 验证对话属于当前用户
  const conversation = await prisma.conversation.findFirst({
    where: { id: conversationId, userId }
  });
  
  if (!conversation) {
    throw createError(404, '对话不存在');
  }
  
  const message = await prisma.chatMessage.create({
      data: {
        content,
        role,
        images,
        conversationId
      }
    });
    
    // 更新对话的更新时间
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() }
    });
    
    return message;
  };
  
  // 获取指定消息之前的所有消息（用于重新生成AI回复）
  const getMessagesBeforeId = async (conversationId, messageId, userId) => {
    // 验证对话属于当前用户
    const conversation = await prisma.conversation.findFirst({
      where: { id: conversationId, userId },
      include: { character: true }
    });
    
    if (!conversation) {
      throw createError(404, '对话不存在');
    }
    
    // 获取目标消息
    const targetMessage = await prisma.chatMessage.findFirst({
      where: { id: messageId, conversationId }
    });
    
    if (!targetMessage) {
      throw createError(404, '消息不存在');
    }
    
    if (targetMessage.role !== 'assistant') {
      throw createError(400, '只能重新生成AI回复');
    }
    
    // 获取该消息之前的所有消息（不包括当前消息）
    const messages = await prisma.chatMessage.findMany({
      where: {
        conversationId,
        createdAt: { lt: targetMessage.createdAt }
      },
      orderBy: { createdAt: 'asc' }
    });
    
    return { messages, character: conversation.character };
  };
  
  // 更新消息内容
  const updateMessageContent = async (messageId, content, userId) => {
    // 先获取消息所在的对话
    const message = await prisma.chatMessage.findUnique({
      where: { id: messageId },
      include: { conversation: true }
    });
    
    if (!message) {
      throw createError(404, '消息不存在');
    }
    
    // 验证对话属于当前用户
    if (message.conversation.userId !== userId) {
      throw createError(403, '无权限操作此消息');
    }
    
    // 更新消息内容
    const updatedMessage = await prisma.chatMessage.update({
      where: { id: messageId },
      data: { content }
    });
    
    return updatedMessage;
  };
  
  // 编辑用户消息并截断历史（删除该消息之后的所有消息）
  const editMessageAndTruncate = async (messageId, newContent, userId) => {
    // 获取消息及其对话
    const message = await prisma.chatMessage.findUnique({
      where: { id: messageId },
      include: { conversation: { include: { character: true } } }
    });
    
    if (!message) {
      throw createError(404, '消息不存在');
    }
    
    // 验证对话属于当前用户
    if (message.conversation.userId !== userId) {
      throw createError(403, '无权限操作此消息');
    }
    
    // 只能编辑用户消息
    if (message.role !== 'user') {
      throw createError(400, '只能编辑用户消息');
    }
    
    const conversationId = message.conversationId;
    
    // 删除该消息之后的所有消息
    await prisma.chatMessage.deleteMany({
      where: {
        conversationId,
        createdAt: { gt: message.createdAt }
      }
    });
    
    // 更新当前消息的内容
    const updatedMessage = await prisma.chatMessage.update({
      where: { id: messageId },
      data: { content: newContent }
    });
    
    // 获取更新后的所有消息（用于返回给前端）
    const remainingMessages = await prisma.chatMessage.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' }
    });
    
    return {
      updatedMessage,
      messages: remainingMessages,
      character: message.conversation.character
    };
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
    addMessage,
    getMessagesBeforeId,
    updateMessageContent,
    editMessageAndTruncate
  };

