const prisma = require('../models/prisma');

const createError = (statusCode, message) => {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
};

const getAdmins = async (page = 1, pageSize = 10) => {
  const skip = (page - 1) * pageSize;
  
  const [admins, total] = await Promise.all([
    prisma.user.findMany({
      where: {
        role: {
          in: ['ADMIN', 'SUPER_ADMIN']
        }
      },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        avatarUrl: true,
        bio: true,
        createdAt: true,
        _count: {
          select: {
            articles: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take: pageSize
    }),
    prisma.user.count({
      where: {
        role: {
          in: ['ADMIN', 'SUPER_ADMIN']
        }
      }
    })
  ]);

  return {
    admins,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize)
    }
  };
};

const createAdmin = async (email, username, password, role = 'ADMIN') => {
  const bcrypt = require('bcrypt');
  const saltRounds = 10;

  const existingEmail = await prisma.user.findUnique({
    where: { email }
  });
  if (existingEmail) {
    throw createError(409, '邮箱已被使用');
  }

  const existingUsername = await prisma.user.findUnique({
    where: { username }
  });
  if (existingUsername) {
    throw createError(409, '用户名已被使用');
  }

  const hashedPassword = await bcrypt.hash(password, saltRounds);

  const admin = await prisma.user.create({
    data: {
      email,
      username,
      password: hashedPassword,
      role
    },
    select: {
      id: true,
      email: true,
      username: true,
      role: true,
      avatarUrl: true,
      bio: true,
      createdAt: true
    }
  });

  return admin;
};

const updateAdmin = async (id, data) => {
  const admin = await prisma.user.findUnique({
    where: { id }
  });

  if (!admin) {
    return null;
  }

  if (admin.role === 'SUPER_ADMIN') {
    throw createError(403, '无法修改超级管理员');
  }

  const { email, username, password, role } = data;

  const updateData = {};

  if (email !== undefined) {
    const existingEmail = await prisma.user.findUnique({
      where: { email }
    });
    if (existingEmail && existingEmail.id !== id) {
      throw createError(409, '邮箱已被使用');
    }
    updateData.email = email;
  }

  if (username !== undefined) {
    const existingUsername = await prisma.user.findUnique({
      where: { username }
    });
    if (existingUsername && existingUsername.id !== id) {
      throw createError(409, '用户名已被使用');
    }
    updateData.username = username;
  }

  if (password !== undefined) {
    const bcrypt = require('bcrypt');
    const saltRounds = 10;
    updateData.password = await bcrypt.hash(password, saltRounds);
  }

  if (role !== undefined) {
    if (role === 'SUPER_ADMIN') {
      throw createError(403, '无法将角色提升为超级管理员');
    }
    updateData.role = role;
  }

  const updatedAdmin = await prisma.user.update({
    where: { id },
    data: updateData,
    select: {
      id: true,
      email: true,
      username: true,
      role: true,
      avatarUrl: true,
      bio: true,
      createdAt: true,
      updatedAt: true
    }
  });

  return updatedAdmin;
};

const deleteAdmin = async (id) => {
  const admin = await prisma.user.findUnique({
    where: { id }
  });

  if (!admin) {
    return null;
  }

  if (admin.role === 'SUPER_ADMIN') {
    throw createError(403, '无法删除超级管理员');
  }

  await prisma.user.delete({
    where: { id }
  });

  return { id };
};

module.exports = {
  getAdmins,
  createAdmin,
  updateAdmin,
  deleteAdmin
};