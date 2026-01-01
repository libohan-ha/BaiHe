const prisma = require('../models/prisma');

const createError = (statusCode, message) => {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
};

const getUsers = async (page = 1, pageSize = 10, keyword = '') => {
  const skip = (page - 1) * pageSize;

  const where = {};
  if (keyword) {
    where.OR = [
      { username: { contains: keyword, mode: 'insensitive' } },
      { email: { contains: keyword, mode: 'insensitive' } }
    ];
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
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
            comments: true,
            collections: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take: pageSize
    }),
    prisma.user.count({ where })
  ]);

  return {
    users,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize)
    }
  };
};

const updateUserRole = async (userId, role, operatorRole) => {
  const user = await prisma.user.findUnique({
    where: { id: userId }
  });

  if (!user) return null;

  // 超级管理员不能被普通管理员修改
  if (user.role === 'SUPER_ADMIN') {
    throw createError(403, '无法修改超级管理员的角色');
  }

  // 只有超级管理员才能将用户提升为管理员
  if (role === 'ADMIN' && operatorRole !== 'SUPER_ADMIN') {
    throw createError(403, '只有超级管理员才能将用户提升为管理员');
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { role },
    select: {
      id: true,
      role: true
    }
  });

  return updated;
};

const deleteUser = async (userId, operatorRole) => {
  const user = await prisma.user.findUnique({
    where: { id: userId }
  });

  if (!user) return null;

  // 超级管理员不能被删除
  if (user.role === 'SUPER_ADMIN') {
    throw createError(403, '无法删除超级管理员');
  }

  // 管理员只能被超级管理员删除
  if (user.role === 'ADMIN' && operatorRole !== 'SUPER_ADMIN') {
    throw createError(403, '只有超级管理员才能删除管理员');
  }

  await prisma.user.delete({
    where: { id: userId }
  });

  return { id: userId };
};

const getArticles = async (page = 1, pageSize = 10, status = null, keyword = '') => {
  const skip = (page - 1) * pageSize;

  const where = {};
  if (status) {
    const upper = String(status).toUpperCase();
    if (upper === 'PUBLISHED' || upper === 'DRAFT') {
      where.status = upper;
    }
  }
  if (keyword) {
    where.OR = [
      { title: { contains: keyword, mode: 'insensitive' } },
      { summary: { contains: keyword, mode: 'insensitive' } }
    ];
  }

  const [articles, total] = await Promise.all([
    prisma.article.findMany({
      where,
      include: {
        author: {
          select: {
            id: true,
            username: true,
            avatarUrl: true
          }
        },
        tags: {
          select: {
            id: true,
            name: true
          }
        },
        _count: {
          select: {
            comments: true,
            collections: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take: pageSize
    }),
    prisma.article.count({ where })
  ]);

  return {
    articles,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize)
    }
  };
};

const updateArticleStatus = async (articleId, status) => {
  const article = await prisma.article.findUnique({
    where: { id: articleId }
  });

  if (!article) return null;

  const upper = String(status).toUpperCase();
  if (upper !== 'PUBLISHED' && upper !== 'DRAFT') {
    throw createError(400, '文章状态无效');
  }

  const updated = await prisma.article.update({
    where: { id: articleId },
    data: { status: upper },
    select: {
      id: true,
      status: true
    }
  });

  return updated;
};

const deleteArticle = async (articleId) => {
  const article = await prisma.article.findUnique({
    where: { id: articleId }
  });

  if (!article) return null;

  await prisma.article.delete({
    where: { id: articleId }
  });

  return { id: articleId };
};

module.exports = {
  getUsers,
  updateUserRole,
  deleteUser,
  getArticles,
  updateArticleStatus,
  deleteArticle
};

