const prisma = require('../models/prisma');
const { createError } = require('../utils/errors');

// ============ 群聊对话相关 ============

/**
 * 创建群聊对话（不绑定主角色）
 * @param {string} userId - 用户ID
 * @param {string} title - 对话标题
 * @param {string[]} memberIds - 群聊成员AI角色ID列表
 */
const createGroupConversation = async (userId, title, memberIds = []) => {
  // 验证所有成员角色都属于当前用户
  if (memberIds.length > 0) {
    const members = await prisma.aICharacter.findMany({
      where: { id: { in: memberIds }, userId }
    });

    if (members.length !== memberIds.length) {
      throw createError(400, '部分AI角色不存在或不属于当前用户');
    }
  }

  // 创建群聊对话（characterId 为空）
  const conversation = await prisma.conversation.create({
    data: {
      title: title || 'AI群聊',
      characterId: null, // 群聊不绑定到单个AI
      userId,
      isGroupChat: true,
      members: {
        create: memberIds.map((aiCharacterId, index) => ({
          aiCharacterId,
          order: index
        }))
      }
    },
    include: {
      members: {
        include: {
          aiCharacter: true
        },
        orderBy: { order: 'asc' }
      }
    }
  });

  return conversation;
};

/**
 * 获取用户的所有群聊对话列表（独立入口）
 */
const getGroupConversations = async (userId) => {
  const conversations = await prisma.conversation.findMany({
    where: {
      userId,
      isGroupChat: true
    },
    orderBy: { updatedAt: 'desc' },
    include: {
      members: {
        include: {
          aiCharacter: true
        },
        orderBy: { order: 'asc' }
      },
      _count: {
        select: { messages: true }
      }
    }
  });
  return { conversations };
};

/**
 * 获取群聊成员列表
 */
const getGroupMembers = async (conversationId, userId) => {
  const conversation = await prisma.conversation.findFirst({
    where: { id: conversationId, userId, isGroupChat: true },
    include: {
      members: {
        include: {
          aiCharacter: true
        },
        orderBy: { order: 'asc' }
      }
    }
  });

  if (!conversation) {
    throw createError(404, '群聊对话不存在');
  }

  return { members: conversation.members, backgroundUrl: conversation.backgroundUrl };
};

/**
 * 添加群聊成员
 */
const addGroupMember = async (conversationId, aiCharacterId, userId) => {
  // 验证对话存在且属于当前用户
  const conversation = await prisma.conversation.findFirst({
    where: { id: conversationId, userId, isGroupChat: true }
  });

  if (!conversation) {
    throw createError(404, '群聊对话不存在');
  }

  // 验证AI角色属于当前用户
  const character = await prisma.aICharacter.findFirst({
    where: { id: aiCharacterId, userId }
  });

  if (!character) {
    throw createError(404, 'AI角色不存在');
  }

  // 检查是否已经是成员
  const existingMember = await prisma.conversationMember.findUnique({
    where: {
      conversationId_aiCharacterId: {
        conversationId,
        aiCharacterId
      }
    }
  });

  if (existingMember) {
    throw createError(400, '该AI角色已在群聊中');
  }

  // 获取当前最大order
  const maxOrderMember = await prisma.conversationMember.findFirst({
    where: { conversationId },
    orderBy: { order: 'desc' }
  });

  const newOrder = (maxOrderMember?.order ?? -1) + 1;

  // 添加成员
  const member = await prisma.conversationMember.create({
    data: {
      conversationId,
      aiCharacterId,
      order: newOrder
    },
    include: {
      aiCharacter: true
    }
  });

  return member;
};

/**
 * 移除群聊成员
 */
const removeGroupMember = async (conversationId, aiCharacterId, userId) => {
  // 验证对话存在且属于当前用户
  const conversation = await prisma.conversation.findFirst({
    where: { id: conversationId, userId, isGroupChat: true }
  });

  if (!conversation) {
    throw createError(404, '群聊对话不存在');
  }

  // 检查成员是否存在
  const member = await prisma.conversationMember.findUnique({
    where: {
      conversationId_aiCharacterId: {
        conversationId,
        aiCharacterId
      }
    }
  });

  if (!member) {
    throw createError(404, '该AI角色不在群聊中');
  }

  // 删除成员
  await prisma.conversationMember.delete({
    where: { id: member.id }
  });

  return { id: member.id };
};

/**
 * 删除群聊对话
 */
const deleteGroupConversation = async (conversationId, userId) => {
  const conversation = await prisma.conversation.findFirst({
    where: { id: conversationId, userId, isGroupChat: true }
  });

  if (!conversation) {
    throw createError(404, '群聊对话不存在');
  }

  await prisma.conversation.delete({
    where: { id: conversationId }
  });

  return { id: conversationId };
};

/**
 * 更新群聊标题
 */
const updateGroupConversationTitle = async (conversationId, title, userId) => {
  const conversation = await prisma.conversation.findFirst({
    where: { id: conversationId, userId, isGroupChat: true }
  });

  if (!conversation) {
    throw createError(404, '群聊对话不存在');
  }

  const updated = await prisma.conversation.update({
    where: { id: conversationId },
    data: { title }
  });

  return updated;
};

/**
 * 更新群聊背景图片
 */
const updateGroupConversationBackground = async (conversationId, backgroundUrl, userId) => {
  const conversation = await prisma.conversation.findFirst({
    where: { id: conversationId, userId, isGroupChat: true }
  });

  if (!conversation) {
    throw createError(404, '群聊对话不存在');
  }

  const updated = await prisma.conversation.update({
    where: { id: conversationId },
    data: { backgroundUrl }
  });

  return updated;
};

/**
 * 获取群聊消息（包含AI角色信息）
 */
const getGroupMessages = async (conversationId, userId) => {
  const conversation = await prisma.conversation.findFirst({
    where: { id: conversationId, userId, isGroupChat: true }
  });

  if (!conversation) {
    throw createError(404, '群聊对话不存在');
  }

  const messages = await prisma.chatMessage.findMany({
    where: { conversationId },
    orderBy: { createdAt: 'asc' },
    include: {
      aiCharacter: {
        select: {
          id: true,
          name: true,
          avatarUrl: true
        }
      }
    }
  });

  return { messages };
};

/**
 * 发送用户消息到群聊
 */
const sendGroupMessage = async (conversationId, content, userId, images = []) => {
  const conversation = await prisma.conversation.findFirst({
    where: { id: conversationId, userId, isGroupChat: true }
  });

  if (!conversation) {
    throw createError(404, '群聊对话不存在');
  }

  const message = await prisma.chatMessage.create({
    data: {
      content,
      role: 'user',
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

/**
 * 保存AI回复消息（群聊，带aiCharacterId）
 */
const saveGroupAIMessage = async (conversationId, content, aiCharacterId, userId) => {
  const conversation = await prisma.conversation.findFirst({
    where: { id: conversationId, userId, isGroupChat: true }
  });

  if (!conversation) {
    throw createError(404, '群聊对话不存在');
  }

  const message = await prisma.chatMessage.create({
    data: {
      content,
      role: 'assistant',
      aiCharacterId,
      conversationId
    },
    include: {
      aiCharacter: {
        select: {
          id: true,
          name: true,
          avatarUrl: true
        }
      }
    }
  });

  // 更新对话的更新时间
  await prisma.conversation.update({
    where: { id: conversationId },
    data: { updatedAt: new Date() }
  });

  return message;
};

/**
 * 获取群聊的最近消息作为上下文
 */
const getGroupChatContext = async (conversationId, userId, limit = 100) => {
  const conversation = await prisma.conversation.findFirst({
    where: { id: conversationId, userId, isGroupChat: true },
    include: {
      members: {
        include: {
          aiCharacter: true
        },
        orderBy: { order: 'asc' }
      }
    }
  });

  if (!conversation) {
    throw createError(404, '群聊对话不存在');
  }

  const messages = await prisma.chatMessage.findMany({
    where: { conversationId },
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      aiCharacter: {
        select: {
          id: true,
          name: true
        }
      }
    }
  });

  // 反转顺序，使最旧的消息在前
  return {
    messages: messages.reverse(),
    members: conversation.members
  };
};

/**
 * 格式化群聊消息为AI API格式
 */
const formatGroupMessagesForAI = (messages, currentAIName, userDisplayName = '用户') => {
  return messages.map(msg => {
    if (msg.role === 'user') {
      return { role: 'user', content: `[${userDisplayName}]: ${msg.content}` };
    }

    // AI消息，标注是哪个AI说的
    const aiName = msg.aiCharacter?.name || '未知AI';
    if (aiName === currentAIName) {
      // 当前AI自己的消息
      return { role: 'assistant', content: msg.content };
    }

    // 其他AI的消息，作为用户消息传递（让当前AI知道其他AI说了什么）
    return { role: 'user', content: `[${aiName}]: ${msg.content}` };
  });
};

module.exports = {
  createGroupConversation,
  getGroupConversations,
  getGroupMembers,
  addGroupMember,
  removeGroupMember,
  deleteGroupConversation,
  updateGroupConversationTitle,
  updateGroupConversationBackground,
  getGroupMessages,
  sendGroupMessage,
  saveGroupAIMessage,
  getGroupChatContext,
  formatGroupMessagesForAI
};
