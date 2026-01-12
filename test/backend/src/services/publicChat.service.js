const prisma = require('../models/prisma');
 
 // 创建消息
 async function createMessage({ content, imageUrl, userId }) {
   return prisma.publicChatMessage.create({
     data: { content, imageUrl, userId },
     include: {
       user: {
         select: { id: true, username: true, avatarUrl: true }
       }
     }
   });
 }
 
 // 获取历史消息（分页，按时间倒序获取，返回时正序）
 async function getMessages({ limit = 50, before }) {
   const messages = await prisma.publicChatMessage.findMany({
     where: before ? { createdAt: { lt: new Date(before) } } : {},
     orderBy: { createdAt: 'desc' },
     take: limit,
     include: {
       user: {
         select: { id: true, username: true, avatarUrl: true }
       }
     }
   });
   // 返回时按时间正序
   return messages.reverse();
 }
 
 // 删除消息（管理员功能）
 async function deleteMessage(messageId) {
   return prisma.publicChatMessage.delete({
     where: { id: messageId }
   });
 }
 
 module.exports = { createMessage, getMessages, deleteMessage };
