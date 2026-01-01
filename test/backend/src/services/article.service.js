const prisma = require('../models/prisma');

const createError = (statusCode, message) => {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
};

const isCuid = (value) => /^c[a-z0-9]{24}$/.test(value);

const normalizeTagsInput = (data) => {
  const raw =
    data?.tags ??
    data?.tagNames ??
    data?.tagIds ??
    data?.tag ??
    undefined;

  if (raw === undefined || raw === null) {
    return { mode: 'none', tagIds: [], tagNames: [] };
  }

  if (typeof raw === 'string') {
    const parts = raw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
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

        // Heuristic: CUID-like id ("cm...") treated as Tag.id, otherwise Tag.name
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

const buildTagsRelation = (data) => {
  const { mode, tagIds, tagNames } = normalizeTagsInput(data);
  if (mode === 'none') return undefined;

  const connect = tagIds.map((id) => ({ id }));
  const connectOrCreate = tagNames.map((name) => ({
    where: { name },
    create: { name }
  }));

  // Explicitly set tags when client sends tags (even if empty) so it can clear tags on update.
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

const getArticles = async (filters) => {
  const page = normalizePageNumber(filters?.page, 1);
  const pageSize = normalizePageNumber(filters?.pageSize, 10);
  const tag = normalizeQueryValue(filters?.tag);
  const search = normalizeQueryValue(filters?.search);
  const sort = normalizeQueryValue(filters?.sort) ?? 'createdAt';

  const skip = (page - 1) * pageSize;
  const take = pageSize;

  const where = {};

  // Public list defaults to PUBLISHED; ignore invalid status inputs like "undefined"/"null".
  const normalizedStatus = normalizeQueryValue(filters?.status);
  if (normalizedStatus && normalizedStatus.toUpperCase() === 'PUBLISHED') {
    where.status = 'PUBLISHED';
  } else {
    where.status = 'PUBLISHED';
  }

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
      { summary: { contains: search, mode: 'insensitive' } },
      { content: { contains: search, mode: 'insensitive' } }
    ];
  }

  const orderBy = {};
  let sortField = sort.startsWith('-') ? sort.substring(1) : sort;
  const sortOrder = sort.startsWith('-') ? 'asc' : 'desc';
  
  // 处理排序字段别名映射
  if (sortField === 'latest' || sortField === 'createdAt') {
    sortField = 'createdAt';
  } else if (sortField === 'popular' || sortField === 'views') {
    sortField = 'views';
  }
  
  orderBy[sortField] = sortOrder;

  const [articles, total] = await Promise.all([
    prisma.article.findMany({
      where,
      skip,
      take,
      orderBy,
      include: {
        author: {
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
            comments: true
          }
        }
      }
    }),
    prisma.article.count({ where })
  ]);

  return {
    articles,
    pagination: {
      page: Number(page),
      pageSize: Number(pageSize),
      total,
      totalPages: Math.ceil(total / pageSize)
    }
  };
};

const getArticleById = async (id) => {
  const article = await prisma.article.findUnique({
    where: { id },
    include: {
      author: {
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
      comments: {
        include: {
          user: {
            select: {
              id: true,
              username: true,
              avatarUrl: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      }
    }
  });

  if (!article) {
    return null;
  }

  await prisma.article.update({
    where: { id },
    data: {
      views: {
        increment: 1
      }
    }
  });

  return article;
};

const createArticle = async (data, authorId) => {
  const { title, summary, content, coverUrl } = data;
  const tagsRelation = buildTagsRelation(data);

  const article = await prisma.article.create({
    data: {
      title,
      summary,
      content,
      coverUrl,
      authorId,
      status: 'PUBLISHED',
      tags: tagsRelation ? {
        ...(tagsRelation.connect ? { connect: tagsRelation.connect } : {}),
        ...(tagsRelation.connectOrCreate ? { connectOrCreate: tagsRelation.connectOrCreate } : {})
      } : undefined
    },
    include: {
      author: {
        select: {
          id: true,
          username: true,
          avatarUrl: true
        }
      },
      tags: true
    }
  });

  return article;
};

const updateArticle = async (id, data, userId, isAdmin) => {
  const article = await prisma.article.findUnique({
    where: { id }
  });

  if (!article) {
    return null;
  }

  if (article.authorId !== userId && !isAdmin) {
    throw createError(403, '无权修改此文章');
  }

  const { title, summary, content, coverUrl } = data;

  const updateData = {};
  if (title !== undefined) updateData.title = title;
  if (summary !== undefined) updateData.summary = summary;
  if (content !== undefined) updateData.content = content;
  if (coverUrl !== undefined) updateData.coverUrl = coverUrl;

  const tagsWasProvided =
    Object.prototype.hasOwnProperty.call(data, 'tags') ||
    Object.prototype.hasOwnProperty.call(data, 'tagIds') ||
    Object.prototype.hasOwnProperty.call(data, 'tagNames') ||
    Object.prototype.hasOwnProperty.call(data, 'tag');

  if (tagsWasProvided) {
    const tagsRelation = buildTagsRelation(data);
    if (!tagsRelation) {
      throw createError(400, '标签格式不正确');
    }
    updateData.tags = tagsRelation;
  }

  const updatedArticle = await prisma.article.update({
    where: { id },
    data: updateData,
    include: {
      author: {
        select: {
          id: true,
          username: true,
          avatarUrl: true
        }
      },
      tags: true
    }
  });

  return updatedArticle;
};

const deleteArticle = async (id, userId, isAdmin) => {
  const article = await prisma.article.findUnique({
    where: { id }
  });

  if (!article) {
    return null;
  }

  if (article.authorId !== userId && !isAdmin) {
    throw createError(403, '无权删除此文章');
  }

  await prisma.article.delete({
    where: { id }
  });

  return { id };
};

const getRelatedArticles = async (id, limit = 5) => {
  const article = await prisma.article.findUnique({
    where: { id },
    include: {
      tags: true
    }
  });

  if (!article) {
    return { articles: [] };
  }

  const tagNames = article.tags.map(tag => tag.name);

  const relatedArticles = await prisma.article.findMany({
    where: {
      id: { not: id },
      tags: {
        some: {
          name: { in: tagNames }
        }
      },
      status: 'PUBLISHED'
    },
    take: limit,
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
    }
  });

  return { articles: relatedArticles };
};

module.exports = {
  getArticles,
  getArticleById,
  createArticle,
  updateArticle,
  deleteArticle,
  getRelatedArticles
};
