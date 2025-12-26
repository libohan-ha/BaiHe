const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const prisma = require('../models/prisma');

const createError = (statusCode, message) => {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
};

const register = async (email, username, password) => {
  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [{ email }, { username }]
    }
  });

  if (existingUser) {
    if (existingUser.email === email) {
      throw createError(409, '邮箱已被注册');
    }
    throw createError(409, '用户名已被使用');
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      email,
      username,
      password: hashedPassword
    },
    select: {
      id: true,
      email: true,
      username: true,
      avatarUrl: true,
      bio: true,
      role: true,
      createdAt: true
    }
  });

  const token = jwt.sign(
    { userId: user.id },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

  return { user, token };
};

const login = async (email, password) => {
  const user = await prisma.user.findUnique({
    where: { email }
  });

  if (!user) {
    throw createError(401, '用户不存在');
  }

  const isValidPassword = await bcrypt.compare(password, user.password);

  if (!isValidPassword) {
    throw createError(401, '密码错误');
  }

  const token = jwt.sign(
    { userId: user.id },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

  return {
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
      role: user.role
    },
    token
  };
};

const getProfile = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      username: true,
      avatarUrl: true,
      bio: true,
      role: true,
      createdAt: true,
      _count: {
        select: {
          articles: true,
          collections: true
        }
      }
    }
  });

  if (!user) {
    throw createError(404, '用户不存在');
  }

  return user;
};

const updateProfile = async (userId, data) => {
  const { username, bio, avatarUrl } = data;

  if (username) {
    const existingUser = await prisma.user.findFirst({
      where: {
        username,
        NOT: { id: userId }
      }
    });

    if (existingUser) {
      throw createError(409, '用户名已被使用');
    }
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      username,
      bio,
      avatarUrl
    },
    select: {
      id: true,
      email: true,
      username: true,
      avatarUrl: true,
      bio: true,
      role: true,
      updatedAt: true
    }
  });

  return user;
};

const updatePassword = async (userId, oldPassword, newPassword) => {
  const user = await prisma.user.findUnique({
    where: { id: userId }
  });

  if (!user) {
    throw createError(404, '用户不存在');
  }

  const isValidPassword = await bcrypt.compare(oldPassword, user.password);

  if (!isValidPassword) {
    throw createError(400, '原密码错误');
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword }
  });

  return true;
};

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  updatePassword
};
