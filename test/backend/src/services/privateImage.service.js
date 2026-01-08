const prisma = require('../models/prisma');

const createError = (statusCode, message) => {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
};

const isCuid = (value) => /^c[a-z0-9]{24}$/.test(value);

/**
 * 标准化标签输入（用于隐私图片标签）
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
 * 构建隐私图片标签关联
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
 * 获取用户的隐私图片列表
 * 只返回当前用户自己的隐私图片
 */
const getPrivateImages = async (ownerId, filters) => {
  const page = normalizePageNumber(filters?.page, 1);
  const pageSize = normalizePageNumber(filters?.pageSize, 10);
  const tag = normalizeQueryValue(filters?.tag);
  const search = normalizeQueryValue(filters?.search);
  const sort = normalizeQueryValue(filters?.sort) ?? 'createdAt';

  const skip = (page - 1) * pageSize;
  const take = pageSize;

  // 关键：只查询当前用户的隐私图片
  const where = { ownerId };

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
  
  if (sortField === 'latest' || sortField === 'createdAt') {
    sortField = 'createdAt';
  }
  
  orderBy[sortField] = sortOrder;

  const [images, total] = await Promise.all([
    prisma.privateImage.findMany({
      where,
      skip,
      take,
      orderBy,
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
    }),
    prisma.privateImage.count({ where })
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
 * 获取单个隐私图片详情
 * 只有所有者可以查看
 */
const getPrivateImageById = async (id, userId) => {
  const image = await prisma.privateImage.findUnique({
    where: { id },
    include: {
      owner: {
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

  // 关键：只有所有者可以查看
  if (image.ownerId !== userId) {
    throw createError(403, '无权查看此隐私图片');
  }

  return image;
};

/**
 * 创建隐私图片
 */
const createPrivateImage = async (data, ownerId) => {
  const { title, description, url, thumbnailUrl, width, height, size } = data;
  const tagsRelation = buildTagsRelation(data);

  const image = await prisma.privateImage.create({
    data: {
      title,
      description,
      url,
      thumbnailUrl,
      width,
      height,
      size,
      ownerId,
      tags: tagsRelation ? {
        ...(tagsRelation.connect ? { connect: tagsRelation.connect } : {}),
        ...(tagsRelation.connectOrCreate ? { connectOrCreate: tagsRelation.connectOrCreate } : {})
      } : undefined
    },
    include: {
      owner: {
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
 * 更新隐私图片
 * 只有所有者可以修改
 */
const updatePrivateImage = async (id, data, userId) => {
  const image = await prisma.privateImage.findUnique({
    where: { id }
  });

  if (!image) {
    return null;
  }

  // 关键：只有所有者可以修改，管理员也不行
  if (image.ownerId !== userId) {
    throw createError(403, '无权修改此隐私图片');
  }

  const { title, description, url, thumbnailUrl } = data;

  const updateData = {};
  if (title !== undefined) updateData.title = title;
  if (description !== undefined) updateData.description = description;
  if (url !== undefined) updateData.url = url;
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

  const updatedImage = await prisma.privateImage.update({
    where: { id },
    data: updateData,
    include: {
      owner: {
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
 * 删除隐私图片
 * 只有所有者可以删除
 */
const deletePrivateImage = async (id, userId) => {
  const image = await prisma.privateImage.findUnique({
    where: { id }
  });

  if (!image) {
    return null;
  }

  // 关键：只有所有者可以删除，管理员也不行
  if (image.ownerId !== userId) {
    throw createError(403, '无权删除此隐私图片');
  }

  await prisma.privateImage.delete({
    where: { id }
  });

  return { id, url: image.url };
};

/**
 * 从公开画廊复制单张图片到隐私相册
 * 注意：这是"复制"而不是"移动"，原图片会保留在画廊中
 * 所有登录用户都可以将任何图片复制到自己的隐私相册
 */
const transferFromGallery = async (imageId, userId) => {
  // 1. 获取公开图片
  const publicImage = await prisma.image.findUnique({
    where: { id: imageId },
    include: {
      tags: {
        select: {
          id: true,
          name: true
        }
      }
    }
  });

  if (!publicImage) {
    throw createError(404, '图片不存在');
  }

  // 2. 检查是否已经复制过（避免重复复制）
  const existingPrivateImage = await prisma.privateImage.findFirst({
    where: {
      ownerId: userId,
      url: publicImage.url
    }
  });

  if (existingPrivateImage) {
    throw createError(400, '该图片已在您的隐私相册中');
  }

  // 3. 创建隐私图片副本，同时同步标签
  const tagNames = publicImage.tags.map(tag => tag.name);
  
  const privateImage = await prisma.privateImage.create({
    data: {
      title: publicImage.title,
      description: publicImage.description,
      url: publicImage.url,
      thumbnailUrl: publicImage.thumbnailUrl,
      width: publicImage.width,
      height: publicImage.height,
      size: publicImage.size,
      ownerId: userId,
      tags: tagNames.length > 0 ? {
        connectOrCreate: tagNames.map(name => ({
          where: { name },
          create: { name }
        }))
      } : undefined
    },
    include: {
      owner: {
        select: {
          id: true,
          username: true,
          avatarUrl: true
        }
      },
      tags: true
    }
  });

  // 注意：不删除原图片，保留在公开画廊中

  return privateImage;
};

/**
 * 批量从公开画廊转移图片到隐私相册
 */
const batchTransferFromGallery = async (imageIds, userId) => {
  if (!Array.isArray(imageIds) || imageIds.length === 0) {
    throw createError(400, '请选择要转移的图片');
  }

  const results = {
    success: [],
    failed: []
  };

  // 使用事务处理批量转移
  for (const imageId of imageIds) {
    try {
      const privateImage = await transferFromGallery(imageId, userId);
      results.success.push({
        originalId: imageId,
        newId: privateImage.id,
        title: privateImage.title
      });
    } catch (error) {
      results.failed.push({
        imageId,
        reason: error.message
      });
    }
  }

  return results;
};

/**
 * 获取隐私图片统计信息
 */
const getPrivateImageStats = async (userId) => {
  const [total, tagCount] = await Promise.all([
    prisma.privateImage.count({
      where: { ownerId: userId }
    }),
    prisma.privateImageTag.count({
      where: {
        images: {
          some: {
            ownerId: userId
          }
        }
      }
    })
  ]);

  return {
    totalImages: total,
    totalTags: tagCount
  };
};

module.exports = {
  getPrivateImages,
  getPrivateImageById,
  createPrivateImage,
  updatePrivateImage,
  deletePrivateImage,
  transferFromGallery,
  batchTransferFromGallery,
  getPrivateImageStats
};