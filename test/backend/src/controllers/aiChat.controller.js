const aiChatService = require('../services/aiChat.service');
const { success, error } = require('../utils/response');

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
    const { content } = req.body;
    
    // 保存用户消息
    const userMessage = await aiChatService.addMessage(conversationId, content, 'user', req.user.id);
    
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
  saveAssistantMessage
};

