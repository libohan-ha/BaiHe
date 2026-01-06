const { auth } = require('../middleware/auth.middleware');
const { body } = require('express-validator');
const validator = require('../middleware/validator');
const {
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
} = require('../controllers/aiChat.controller');

const router = require('express').Router();

// 所有路由都需要认证
router.use(auth);

// ============ AI API 代理路由 ============
// 通过后端代理转发 AI 请求，避免 CORS 问题
router.post('/proxy', [
  body('apiUrl').notEmpty().withMessage('API URL 不能为空'),
  body('apiKey').notEmpty().withMessage('API Key 不能为空'),
  body('model').notEmpty().withMessage('模型名称不能为空'),
  body('messages').isArray().withMessage('消息必须是数组'),
  validator
], proxyAIRequest);

// ============ AI角色路由 ============

// 获取用户的所有AI角色
router.get('/characters', getCharacters);

// 获取单个AI角色
router.get('/characters/:id', getCharacterById);

// 创建AI角色
router.post('/characters', [
  body('name').notEmpty().withMessage('角色名称不能为空'),
  body('prompt').notEmpty().withMessage('角色提示词不能为空'),
  validator
], createCharacter);

// 更新AI角色
router.put('/characters/:id', updateCharacter);

// 删除AI角色
router.delete('/characters/:id', deleteCharacter);

// ============ 对话路由 ============

// 获取角色的所有对话
router.get('/characters/:characterId/conversations', getConversations);

// 创建新对话
router.post('/characters/:characterId/conversations', createConversation);

// 更新对话（标题等）
router.put('/conversations/:id', updateConversation);

// 删除对话
router.delete('/conversations/:id', deleteConversation);

// ============ 消息路由 ============

// 获取对话的所有消息
router.get('/conversations/:conversationId/messages', getMessages);

// 发送用户消息
router.post('/conversations/:conversationId/messages', [
  body('content').notEmpty().withMessage('消息内容不能为空'),
  validator
], sendMessage);

// 保存AI回复消息
router.post('/conversations/:conversationId/assistant-message', [
  body('content').notEmpty().withMessage('消息内容不能为空'),
  validator
], saveAssistantMessage);

// 重新生成AI回复
router.post('/conversations/:conversationId/messages/:messageId/regenerate', [
  body('apiUrl').notEmpty().withMessage('API URL 不能为空'),
  body('apiKey').notEmpty().withMessage('API Key 不能为空'),
  body('model').notEmpty().withMessage('模型名称不能为空'),
  validator
], regenerateAssistantMessage);

// 编辑消息并重新生成AI回复
router.post('/conversations/:conversationId/messages/:messageId/edit-and-regenerate', [
  body('content').notEmpty().withMessage('消息内容不能为空'),
  body('apiUrl').notEmpty().withMessage('API URL 不能为空'),
  body('apiKey').notEmpty().withMessage('API Key 不能为空'),
  body('model').notEmpty().withMessage('模型名称不能为空'),
  validator
], editAndRegenerateMessage);

module.exports = router;

