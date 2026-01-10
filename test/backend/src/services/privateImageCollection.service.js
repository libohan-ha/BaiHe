const prisma = require('../models/prisma');
const { createError } = require('../utils/errors');

/**
 * 获取用户收藏的隐私图片列表
 */
const getCollections = async (userId, filters = {}) => {
  const page = parseInt(filters.page) || 1;
  const pageSize = parseInt(filters.pageSize) || 10;

  const skip = (page - 1) * pageSize;
  const take = pageSize;

  const where = { userId };

  const [collections, total] = await Promise.all([
    prisma.privateImageCollection.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        image: {
          include: {
            owner: {
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
                collections: true
              }
            }
          }
        }
      }
    }),
    prisma.privateImageCollection.count({ where })
  ]);

  return {
    collections: collections.map(c => ({
      id: c.id,
      image: c.image,
      createdAt: c.createdAt
    })),
    pagination: {
      page: Number(page),
      pageSize: Number(pageSize),
      total,
      totalPages: Math.ceil(total / pageSize)
    }
  };
};

/**
 * 添加隐私图片收藏
 */
const addCollection = async (userId, imageId) => {
  // 检查隐私图片是否存在
  const image = await prisma.privateImage.findUnique({
    where: { id: imageId }
  });

  if (!image) {
    throw createError(404, '隐私图片不存在');
  }

  // 验证是否为图片所有者（只有所有者可以收藏自己的隐私图片）
  if (image.ownerId !== userId) {
    throw createError(403, '无权访问此隐私图片');
  }

  // 检查是否已收藏
  const existingCollection = await prisma.privateImageCollection.findUnique({
    where: {
      userId_imageId: {
        userId,
        imageId
      }
    }
  });

  if (existingCollection) {
    throw createError(409, '已收藏该图片');
  }

  const collection = await prisma.privateImageCollection.create({
    data: {
      userId,
      imageId
    },
    include: {
      image: {
        include: {
          owner: {
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
    }
  });

  return {
    id: collection.id,
    imageId: collection.imageId,
    createdAt: collection.createdAt
  };
};

/**
 * 取消隐私图片收藏
 */
const removeCollection = async (userId, collectionId) => {
  const collection = await prisma.privateImageCollection.findUnique({
    where: { id: collectionId }
  });

  if (!collection) {
    throw createError(404, '收藏记录不存在');
  }

  if (collection.userId !== userId) {
    throw createError(403, '无权操作此收藏');
  }

  await prisma.privateImageCollection.delete({
    where: { id: collectionId }
  });

  return { id: collectionId };
};

/**
 * 通过图片ID取消收藏
 */
const removeCollectionByImageId = async (userId, imageId) => {
  const collection = await prisma.privateImageCollection.findUnique({
    where: {
      userId_imageId: {
        userId,
        imageId
      }
    }
  });

  if (!collection) {
    throw createError(404, '未收藏该图片');
  }

  await prisma.privateImageCollection.delete({
    where: { id: collection.id }
  });

  return { id: collection.id };
};

/**
 * 检查用户是否已收藏某隐私图片
 */
const checkCollection = async (userId, imageId) => {
  const collection = await prisma.privateImageCollection.findUnique({
    where: {
      userId_imageId: {
        userId,
        imageId
      }
    }
  });

  return {
    collected: !!collection,
    collectionId: collection?.id || null
  };
};

module.exports = {
  getCollections,
  addCollection,
  removeCollection,
  removeCollectionByImageId,
  checkCollection
};