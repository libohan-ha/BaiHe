const jwt = require('jsonwebtoken');
const prisma = require('../models/prisma');

const auth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        code: 401,
        message: '未授权，请先登录',
        data: null
      });
    }

    const token = authHeader.split(' ')[1];
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          email: true,
          username: true,
          role: true,
          avatarUrl: true
        }
      });

      if (!user) {
        return res.status(401).json({
          code: 401,
          message: '用户不存在',
          data: null
        });
      }

      req.user = user;
      req.token = token;
      next();
    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({
          code: 401,
          message: 'Token 已过期',
          data: null
        });
      }
      return res.status(401).json({
        code: 401,
        message: 'Token 无效',
        data: null
      });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      code: 500,
      message: '服务器内部错误',
      data: null
    });
  }
};

const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.split(' ')[1];
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          email: true,
          username: true,
          role: true,
          avatarUrl: true
        }
      });

      if (user) {
        req.user = user;
        req.token = token;
      }
    } catch (jwtError) {
    }

    next();
  } catch (error) {
    next();
  }
};

const admin = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      code: 401,
      message: '未授权，请先登录',
      data: null
    });
  }

  if (['ADMIN', 'SUPER_ADMIN'].includes(req.user.role)) {
    return next();
  }
  return res.status(403).json({
    code: 403,
    message: '禁止访问，需要管理员权限',
    data: null
  });
};

const superAdmin = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      code: 401,
      message: '未授权，请先登录',
      data: null
    });
  }

  if (req.user.role === 'SUPER_ADMIN') {
    return next();
  }
  return res.status(403).json({
    code: 403,
    message: '禁止访问，需要超级管理员权限',
    data: null
  });
};

module.exports = { auth, optionalAuth, admin, superAdmin };
