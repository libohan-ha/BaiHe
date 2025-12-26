const prisma = require('../models/prisma');

const getAllUsers = async (page = 1, pageSize = 10, keyword = '') => {
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

const getUserById = async (id) => {
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      username: true,
      avatarUrl: true,
      bio: true,
      role: true,
      createdAt: true
    }
  });

  return user;
};

const getUserArticles = async (userId, page = 1, pageSize = 10) => {
  const skip = (page - 1) * pageSize;

  const [articles, total] = await Promise.all([
    prisma.article.findMany({
      where: {
        authorId: userId,
        status: 'PUBLISHED'
      },
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
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take: pageSize
    }),
    prisma.article.count({
      where: {
        authorId: userId,
        status: 'PUBLISHED'
      }
    })
  ]);

  const totalPages = Math.ceil(total / pageSize);

  return {
    articles,
    pagination: {
      page,
      pageSize,
      total,
      totalPages
    }
  };
};

const getUserCollections = async (userId, page = 1, pageSize = 10) => {
  const skip = (page - 1) * pageSize;

  const [collections, total] = await Promise.all([
    prisma.collection.findMany({
      where: { userId },
      include: {
        article: {
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
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take: pageSize
    }),
    prisma.collection.count({
      where: { userId }
    })
  ]);

  const items = collections
    .filter((c) => c.article)
    .map((c) => ({
      id: c.id,
      articleId: c.articleId,
      collectedAt: c.createdAt,
      article: c.article
    }));
  const totalPages = Math.ceil(total / pageSize);

  return {
    collections: items,
    pagination: {
      page,
      pageSize,
      total,
      totalPages
    }
  };
};

const updateUserProfile = async (userId, data) => {
  const { username, bio, avatarUrl } = data;

  const updateData = {};
  if (username) updateData.username = username;
  if (bio !== undefined) updateData.bio = bio;
  if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl;

  const user = await prisma.user.update({
    where: { id: userId },
    data: updateData,
    select: {
      id: true,
      email: true,
      username: true,
      avatarUrl: true,
      bio: true,
      role: true
    }
  });

  return user;
};

module.exports = {
  getAllUsers,
  getUserById,
  getUserArticles,
  getUserCollections,
  updateUserProfile
};
