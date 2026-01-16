const { auth } = require('../middleware/auth.middleware');
const {
  createGroupConversation,
  getGroupConversations,
  deleteGroupConversation,
  updateGroupConversationTitle,
  updateGroupConversationBackground,
  updateGroupConversationBubbleOpacity,
  getGroupMembers,
  addGroupMember,
  removeGroupMember,
  getGroupMessages,
  sendGroupMessage,
  groupChatWithAI
} = require('../controllers/aiGroupChat.controller');

const router = require('express').Router();

// 所有路由都需要认证
router.use(auth);

// ============ 群聊对话管理 ============

// 创建群聊对话
router.post('/conversations', createGroupConversation);

// 获取当前用户的所有群聊对话列表
router.get('/conversations', getGroupConversations);

// 删除群聊对话
router.delete('/conversations/:conversationId', deleteGroupConversation);

// 更新群聊标题
router.patch('/conversations/:conversationId/title', updateGroupConversationTitle);

// 更新群聊背景图片
router.patch('/conversations/:conversationId/background', updateGroupConversationBackground);

// 更新群聊气泡透明度
router.patch('/conversations/:conversationId/bubble-opacity', updateGroupConversationBubbleOpacity);

// ============ 群聊成员管理 ============

// 获取群聊成员列表
router.get('/conversations/:conversationId/members', getGroupMembers);

// 添加群聊成员
router.post('/conversations/:conversationId/members', addGroupMember);

// 移除群聊成员
router.delete('/conversations/:conversationId/members/:aiCharacterId', removeGroupMember);

// ============ 群聊消息 ============

// 获取群聊消息
router.get('/conversations/:conversationId/messages', getGroupMessages);

// 发送用户消息到群聊
router.post('/conversations/:conversationId/messages', sendGroupMessage);

// 群聊AI回复（SSE流式）
router.post('/conversations/:conversationId/ai-reply', groupChatWithAI);

module.exports = router;
