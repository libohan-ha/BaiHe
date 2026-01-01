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

const addMessage = async (conversationId, content, role, userId) => {
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
  addMessage
};

