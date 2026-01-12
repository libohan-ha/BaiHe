 const { Server } = require('socket.io');
 const jwt = require('jsonwebtoken');
 const chatHandler = require('./chatHandler');
 const prisma = require('../models/prisma');
 
 function initSocket(server) {
   const io = new Server(server, {
     cors: {
       origin: process.env.CORS_ORIGIN || '*',
       credentials: true
     }
   });
 
   // JWT 认证中间件
   io.use(async (socket, next) => {
     const token = socket.handshake.auth.token;
     if (!token) {
       return next(new Error('未授权'));
     }
     try {
       const decoded = jwt.verify(token, process.env.JWT_SECRET);
       
       // 从数据库查询用户信息
       const user = await prisma.user.findUnique({
         where: { id: decoded.userId },
         select: { id: true, username: true, avatarUrl: true }
       });
       
       if (!user) {
         return next(new Error('用户不存在'));
       }
       
       socket.userId = user.id;
       socket.username = user.username;
       socket.avatarUrl = user.avatarUrl;
       next();
     } catch (err) {
       next(new Error('token无效'));
     }
   });
 
   io.on('connection', (socket) => chatHandler(io, socket));
 
   return io;
 }
 
 module.exports = { initSocket };
