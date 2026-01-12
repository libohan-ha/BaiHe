 const express = require('express');
 const router = express.Router();
const { optionalAuth } = require('../middleware/auth.middleware');
 const publicChatController = require('../controllers/publicChat.controller');
 
 // 获取历史消息（可选登录）
 router.get('/messages', optionalAuth, publicChatController.getMessages);
 
 module.exports = router;
