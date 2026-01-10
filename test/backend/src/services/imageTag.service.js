const prisma = require('../models/prisma');
const { createError } = require('../utils/errors');

/**
 * 获取图片标签列表
 */
const getImageTags = async (filters = {}) => {
  const { search, page = 1, pageSize = 50 } = filters;

  const where = {};

  if (search) {
    where.name = { contains: search, mode: 'insensitive' };
  }

  const skip = (page - 1) * pageSize;
  const take = pageSize;

  const [tags, total] = await Promise.all([
    prisma.imageTag.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            images: true
          }
        }
      }
    }),
    prisma.imageTag.count({ where })
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
 * 获取热门图片标签
 */
const getPopularImageTags = async (limit = 10) => {
  const tags = await prisma.imageTag.findMany({
    take: limit,
    include: {
      _count: {
        select: {
          images: true
        }
      }
    },
    orderBy: {
      images: {
        _count: 'desc'
      }
    }
  });

  return tags.map(tag => ({
    id: tag.id,
    name: tag.name,
    imageCount: tag._count.images
  }));
};

/**
 * 获取单个图片标签详情
 */
const getImageTagById = async (id) => {
  const tag = await prisma.imageTag.findUnique({
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

  return {
    ...tag,
    imageCount: tag._count.images
  };
};

/**
 * 创建图片标签
 */
const createImageTag = async (name) => {
  // 检查标签是否已存在
  const existingTag = await prisma.imageTag.findUnique({
    where: { name }
  });

  if (existingTag) {
    throw createError(409, '标签已存在');
  }

  const tag = await prisma.imageTag.create({
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
 * 更新图片标签
 */
const updateImageTag = async (id, name) => {
  const tag = await prisma.imageTag.findUnique({
    where: { id }
  });

  if (!tag) {
    return null;
  }

  // 检查新名称是否已被其他标签使用
  const existingTag = await prisma.imageTag.findFirst({
    where: {
      name,
      NOT: { id }
    }
  });

  if (existingTag) {
    throw createError(409, '标签名称已存在');
  }

  const updatedTag = await prisma.imageTag.update({
    where: { id },
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
    ...updatedTag,
    imageCount: updatedTag._count.images
  };
};

/**
 * 删除图片标签
 */
const deleteImageTag = async (id) => {
  const tag = await prisma.imageTag.findUnique({
    where: { id }
  });

  if (!tag) {
    return null;
  }

  await prisma.imageTag.delete({
    where: { id }
  });

  return { id };
};

module.exports = {
  getImageTags,
  getPopularImageTags,
  getImageTagById,
  createImageTag,
  updateImageTag,
  deleteImageTag
};