 const publicChatService = require('../services/publicChat.service');
 const { success } = require('../utils/response');
 
 // 获取历史消息
 async function getMessages(req, res, next) {
   try {
     const { limit = 50, before } = req.query;
     const messages = await publicChatService.getMessages({
       limit: parseInt(limit),
       before
     });
     res.json(success(messages));
   } catch (error) {
     next(error);
   }
 }
 
 module.exports = { getMessages };
