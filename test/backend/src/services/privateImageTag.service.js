const prisma = require('../models/prisma');

const createError = (statusCode, message) => {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
};

/**
 * 获取用户的隐私图片标签列表
 * 只返回该用户隐私图片使用的标签
 */
const getPrivateImageTags = async (userId, filters = {}) => {
  const { search, page = 1, pageSize = 50 } = filters;

  const where = {
    images: {
      some: {
        ownerId: userId
      }
    }
  };

  if (search) {
    where.name = { contains: search, mode: 'insensitive' };
  }

  const skip = (page - 1) * pageSize;
  const take = pageSize;

  const [tags, total] = await Promise.all([
    prisma.privateImageTag.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            images: {
              where: {
                ownerId: userId
              }
            }
          }
        }
      }
    }),
    prisma.privateImageTag.count({ where })
  ]);

  return {
    tags: tags.map(tag => ({
      ...tag,
      imageCount: tag._count.images
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
 * 获取用户的热门隐私图片标签
 */
const getPopularPrivateImageTags = async (userId, limit = 10) => {
  // 获取用户隐私图片使用的标签，按图片数量排序
  const tags = await prisma.privateImageTag.findMany({
    where: {
      images: {
        some: {
          ownerId: userId
        }
      }
    },
    take: limit,
    include: {
      _count: {
        select: {
          images: {
            where: {
              ownerId: userId
            }
          }
        }
      }
    }
  });

  // 按图片数量排序
  const sortedTags = tags.sort((a, b) => b._count.images - a._count.images);

  return sortedTags.map(tag => ({
    id: tag.id,
    name: tag.name,
    imageCount: tag._count.images
  }));
};

/**
 * 获取单个隐私图片标签详情
 */
const getPrivateImageTagById = async (id, userId) => {
  const tag = await prisma.privateImageTag.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          images: {
            where: {
              ownerId: userId
            }
          }
        }
      }
    }
  });

  if (!tag) {
    return null;
  }

  return {
    ...tag,
    imageCount: tag._count.images
  };
};

/**
 * 创建隐私图片标签
 */
const createPrivateImageTag = async (name) => {
  // 检查标签是否已存在
  const existingTag = await prisma.privateImageTag.findUnique({
    where: { name }
  });

  if (existingTag) {
    // 如果已存在，直接返回
    return {
      ...existingTag,
      imageCount: 0
    };
  }

  const tag = await prisma.privateImageTag.create({
    data: { name },
    include: {
      _count: {
        select: {
          images: true
        }
      }
    }
  });

  return {
    ...tag,
    imageCount: tag._count.images
  };
};

/**
 * 更新隐私图片标签
 * 只有用户自己使用的标签可以修改
 */
const updatePrivateImageTag = async (id, name, userId) => {
  const tag = await prisma.privateImageTag.findUnique({
    where: { id },
    include: {
      images: {
        where: {
          ownerId: userId
        },
        take: 1
      }
    }
  });

  if (!tag) {
    return null;
  }

  // 检查用户是否使用了这个标签
  if (tag.images.length === 0) {
    throw createError(403, '无权修改此标签');
  }

  // 检查新名称是否已被其他标签使用
  const existingTag = await prisma.privateImageTag.findFirst({
    where: {
      name,
      NOT: { id }
    }
  });

  if (existingTag) {
    throw createError(409, '标签名称已存在');
  }

  const updatedTag = await prisma.privateImageTag.update({
    where: { id },
    data: { name },
    include: {
      _count: {
        select: {
          images: {
            where: {
              ownerId: userId
            }
          }
        }
      }
    }
  });

  return {
    ...updatedTag,
    imageCount: updatedTag._count.images
  };
};

/**
 * 删除隐私图片标签
 * 只有没有任何图片使用的标签可以删除
 */
const deletePrivateImageTag = async (id) => {
  const tag = await prisma.privateImageTag.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          images: true
        }
      }
    }
  });

  if (!tag) {
    return null;
  }

  if (tag._count.images > 0) {
    throw createError(400, '该标签下还有图片，无法删除');
  }

  await prisma.privateImageTag.delete({
    where: { id }
  });

  return { id };
};

module.exports = {
  getPrivateImageTags,
  getPopularPrivateImageTags,
  getPrivateImageTagById,
  createPrivateImageTag,
  updatePrivateImageTag,
  deletePrivateImageTag
};