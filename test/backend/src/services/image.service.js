const prisma = require('../models/prisma');

const createError = (statusCode, message) => {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
};

const isCuid = (value) => /^c[a-z0-9]{24}$/.test(value);

/**
 * 标准化标签输入
 */
const normalizeTagsInput = (data) => {
  const raw = data?.tags ?? data?.tagNames ?? data?.tagIds ?? undefined;

  if (raw === undefined || raw === null) {
    return { mode: 'none', tagIds: [], tagNames: [] };
  }

  if (typeof raw === 'string') {
    const parts = raw.split(',').map((s) => s.trim()).filter(Boolean);
    return { mode: 'replace', tagIds: [], tagNames: parts };
  }

  if (Array.isArray(raw)) {
    const tagIds = [];
    const tagNames = [];

    for (const item of raw) {
      if (!item) continue;

      if (typeof item === 'string') {
        const value = item.trim();
        if (!value) continue;
        if (isCuid(value)) {
          tagIds.push(value);
        } else {
          tagNames.push(value);
        }
        continue;
      }

      if (typeof item === 'object') {
        const possibleName = item.name ?? item.label;
        const possibleValue = item.value ?? item.id;

        if (typeof possibleValue === 'string' && possibleValue.trim()) {
          const v = possibleValue.trim();
          if (isCuid(v)) {
            tagIds.push(v);
            continue;
          }
        }

        if (typeof possibleName === 'string' && possibleName.trim()) {
          tagNames.push(possibleName.trim());
        }
      }
    }

    return { mode: 'replace', tagIds, tagNames };
  }

  return { mode: 'none', tagIds: [], tagNames: [] };
};

/**
 * 构建标签关联
 */
const buildTagsRelation = (data) => {
  const { mode, tagIds, tagNames } = normalizeTagsInput(data);
  if (mode === 'none') return undefined;

  const connect = tagIds.map((id) => ({ id }));
  const connectOrCreate = tagNames.map((name) => ({
    where: { name },
    create: { name }
  }));

  return {
    set: [],
    ...(connect.length ? { connect } : {}),
    ...(connectOrCreate.length ? { connectOrCreate } : {})
  };
};

const normalizeQueryValue = (value) => {
  if (value === undefined || value === null) return undefined;
  const str = String(value).trim();
  if (!str) return undefined;
  const lowered = str.toLowerCase();
  if (lowered === 'undefined' || lowered === 'null') return undefined;
  return str;
};

const normalizePageNumber = (value, fallback) => {
  const str = normalizeQueryValue(value);
  const num = str ? Number(str) : NaN;
  if (!Number.isFinite(num) || num <= 0) return fallback;
  return Math.floor(num);
};

/**
 * 获取图片列表
 */
const getImages = async (filters) => {
  const page = normalizePageNumber(filters?.page, 1);
  const pageSize = normalizePageNumber(filters?.pageSize, 10);
  const tag = normalizeQueryValue(filters?.tag);
  const search = normalizeQueryValue(filters?.search);
  const sort = normalizeQueryValue(filters?.sort) ?? 'createdAt';

  const skip = (page - 1) * pageSize;
  const take = pageSize;

  const where = {};

  if (tag) {
    where.tags = {
      some: {
        ...(isCuid(tag) ? { id: tag } : { name: tag })
      }
    };
  }

  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } }
    ];
  }

  const orderBy = {};
  let sortField = sort.startsWith('-') ? sort.substring(1) : sort;
  const sortOrder = sort.startsWith('-') ? 'asc' : 'desc';
  
  // 处理热门排序
  if (sortField === 'popular' || sortField === 'views') {
    sortField = 'views';
  } else if (sortField === 'latest' || sortField === 'createdAt') {
    sortField = 'createdAt';
  }
  
  orderBy[sortField] = sortOrder;

  const [images, total] = await Promise.all([
    prisma.image.findMany({
      where,
      skip,
      take,
      orderBy,
      include: {
        uploader: {
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
    }),
    prisma.image.count({ where })
  ]);

  return {
    images,
    pagination: {
      page: Number(page),
      pageSize: Number(pageSize),
      total,
      totalPages: Math.ceil(total / pageSize)
    }
  };
};

/**
 * 获取单个图片详情
 */
const getImageById = async (id) => {
  const image = await prisma.image.findUnique({
    where: { id },
    include: {
      uploader: {
        select: {
          id: true,
          username: true,
          avatarUrl: true,
          bio: true
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
  });

  if (!image) {
    return null;
  }

  // 增加浏览次数
  await prisma.image.update({
    where: { id },
    data: {
      views: {
        increment: 1
      }
    }
  });

  return image;
};

/**
 * 创建图片
 */
const createImage = async (data, uploaderId) => {
  const { title, description, url, thumbnailUrl, width, height, size } = data;
  const tagsRelation = buildTagsRelation(data);

  const image = await prisma.image.create({
    data: {
      title,
      description,
      url,
      thumbnailUrl,
      width,
      height,
      size,
      uploaderId,
      tags: tagsRelation ? {
        ...(tagsRelation.connect ? { connect: tagsRelation.connect } : {}),
        ...(tagsRelation.connectOrCreate ? { connectOrCreate: tagsRelation.connectOrCreate } : {})
      } : undefined
    },
    include: {
      uploader: {
        select: {
          id: true,
          username: true,
          avatarUrl: true
        }
      },
      tags: true
    }
  });

  return image;
};

/**
 * 更新图片
 */
const updateImage = async (id, data, userId, isAdmin) => {
  const image = await prisma.image.findUnique({
    where: { id }
  });

  if (!image) {
    return null;
  }

  if (image.uploaderId !== userId && !isAdmin) {
    throw createError(403, '无权修改此图片');
  }

  const { title, description, thumbnailUrl } = data;

  const updateData = {};
  if (title !== undefined) updateData.title = title;
  if (description !== undefined) updateData.description = description;
  if (thumbnailUrl !== undefined) updateData.thumbnailUrl = thumbnailUrl;

  const tagsWasProvided =
    Object.prototype.hasOwnProperty.call(data, 'tags') ||
    Object.prototype.hasOwnProperty.call(data, 'tagIds') ||
    Object.prototype.hasOwnProperty.call(data, 'tagNames');

  if (tagsWasProvided) {
    const tagsRelation = buildTagsRelation(data);
    if (!tagsRelation) {
      throw createError(400, '标签格式不正确');
    }
    updateData.tags = tagsRelation;
  }

  const updatedImage = await prisma.image.update({
    where: { id },
    data: updateData,
    include: {
      uploader: {
        select: {
          id: true,
          username: true,
          avatarUrl: true
        }
      },
      tags: true
    }
  });

  return updatedImage;
};

/**
 * 删除图片
 */
const deleteImage = async (id, userId, isAdmin) => {
  const image = await prisma.image.findUnique({
    where: { id }
  });

  if (!image) {
    return null;
  }

  if (image.uploaderId !== userId && !isAdmin) {
    throw createError(403, '无权删除此图片');
  }

  await prisma.image.delete({
    where: { id }
  });

  return { id, url: image.url };
};

/**
 * 获取用户的图片列表
 */
const getUserImages = async (userId, filters) => {
  const page = normalizePageNumber(filters?.page, 1);
  const pageSize = normalizePageNumber(filters?.pageSize, 10);

  const skip = (page - 1) * pageSize;
  const take = pageSize;

  const where = { uploaderId: userId };

  const [images, total] = await Promise.all([
    prisma.image.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        uploader: {
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
    }),
    prisma.image.count({ where })
  ]);

  return {
    images,
    pagination: {
      page: Number(page),
      pageSize: Number(pageSize),
      total,
      totalPages: Math.ceil(total / pageSize)
    }
  };
};

/**
 * 管理员获取所有图片
 */
const getAllImages = async (filters) => {
  const page = normalizePageNumber(filters?.page, 1);
  const pageSize = normalizePageNumber(filters?.pageSize, 20);
  const uploaderId = normalizeQueryValue(filters?.uploaderId);
  const search = normalizeQueryValue(filters?.search);

  const skip = (page - 1) * pageSize;
  const take = pageSize;

  const where = {};

  if (uploaderId) {
    where.uploaderId = uploaderId;
  }

  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } }
    ];
  }

  const [images, total] = await Promise.all([
    prisma.image.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        uploader: {
          select: {
            id: true,
            username: true,
            email: true,
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
    }),
    prisma.image.count({ where })
  ]);

  return {
    images,
    pagination: {
      page: Number(page),
      pageSize: Number(pageSize),
      total,
      totalPages: Math.ceil(total / pageSize)
    }
  };
};

/**
 * 管理员删除图片
 */
const adminDeleteImage = async (id) => {
  const image = await prisma.image.findUnique({
    where: { id }
  });

  if (!image) {
    return null;
  }

  await prisma.image.delete({
    where: { id }
  });

  return { id, url: image.url };
};

module.exports = {
  getImages,
  getImageById,
  createImage,
  updateImage,
  deleteImage,
  getUserImages,
  getAllImages,
  adminDeleteImage
};