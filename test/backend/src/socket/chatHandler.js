 const publicChatService = require('../services/publicChat.service');
 
 // 在线用户列表
 const onlineUsers = new Map();
 
 module.exports = function chatHandler(io, socket) {
   console.log(`用户连接: ${socket.username} (${socket.userId})`);
 
   // 加入公共聊天室
   socket.join('public-room');
 
   // 添加到在线用户列表
   onlineUsers.set(socket.userId, {
     id: socket.userId,
     username: socket.username,
     avatarUrl: socket.avatarUrl
   });
 
   // 广播用户加入
   io.to('public-room').emit('user:join', {
     userId: socket.userId,
     username: socket.username,
     onlineCount: onlineUsers.size
   });
 
   // 发送在线用户列表给新连接的用户
   socket.emit('users:online', Array.from(onlineUsers.values()));
 
   // 接收消息
   socket.on('message:send', async (data) => {
     try {
       const { content, imageUrl } = data;
       if (!content?.trim() && !imageUrl) return;
 
       // 保存到数据库
       const message = await publicChatService.createMessage({
         content: content?.trim() || '',
         imageUrl,
         userId: socket.userId
       });
 
       // 广播给所有人
       io.to('public-room').emit('message:new', message);
     } catch (error) {
       console.error('发送消息失败:', error);
       socket.emit('message:error', { message: '发送消息失败' });
     }
   });
 
   // 断开连接
   socket.on('disconnect', () => {
     console.log(`用户断开: ${socket.username} (${socket.userId})`);
     onlineUsers.delete(socket.userId);
     io.to('public-room').emit('user:leave', {
       userId: socket.userId,
       username: socket.username,
       onlineCount: onlineUsers.size
     });
   });
 };
