const prisma = require('../models/prisma');

/**
 * 获取评论列表（支持文章评论和图片评论）
 * @param {Object} options - 查询选项
 * @param {string} options.articleId - 文章ID（可选）
 * @param {string} options.imageId - 图片ID（可选）
 * @param {number} options.page - 页码
 * @param {number} options.pageSize - 每页数量
 */
const getComments = async ({ articleId, imageId, page = 1, pageSize = 10 }) => {
  const skip = (page - 1) * pageSize;

  // 构建查询条件
  const whereCondition = {
    parentId: null
  };
  
  if (articleId) {
    whereCondition.articleId = articleId;
  } else if (imageId) {
    whereCondition.imageId = imageId;
  }

  // 获取一级评论
  const [topLevelComments, total] = await Promise.all([
    prisma.comment.findMany({
      where: whereCondition,
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
      },
      skip,
      take: pageSize
    }),
    prisma.comment.count({
      where: whereCondition
    })
  ]);

  // 获取所有一级评论的ID
  const topLevelIds = topLevelComments.map(c => c.id);

  // 构建回复查询条件
  const repliesWhereCondition = {
    parentId: { not: null }
  };
  
  if (articleId) {
    repliesWhereCondition.articleId = articleId;
  } else if (imageId) {
    repliesWhereCondition.imageId = imageId;
  }

  // 获取这些一级评论下的所有回复（包括二级、三级等）
  const allReplies = await prisma.comment.findMany({
    where: repliesWhereCondition,
    include: {
      user: {
        select: {
          id: true,
          username: true,
          avatarUrl: true
        }
      },
      parent: {
        select: {
          id: true,
          parentId: true,
          user: {
            select: {
              id: true,
              username: true,
              avatarUrl: true
            }
          }
        }
      }
    },
    orderBy: {
      createdAt: 'asc'
    }
  });

  // 找到每个一级评论的根ID（递归向上查找）
  const findRootParentId = (comment, allComments) => {
    if (!comment.parentId) return comment.id;
    if (topLevelIds.includes(comment.parentId)) return comment.parentId;
    const parentComment = allComments.find(c => c.id === comment.parentId);
    if (!parentComment) return comment.parentId;
    return findRootParentId(parentComment, allComments);
  };

  // 为每个回复添加 replyToUser 字段
  // 如果父评论是一级评论，则不需要 replyToUser
  // 如果父评论不是一级评论，则需要 replyToUser
  const repliesWithReplyTo = allReplies.map(reply => {
    const isDirectReplyToTopLevel = topLevelIds.includes(reply.parentId);
    return {
      ...reply,
      replyToUser: isDirectReplyToTopLevel ? null : reply.parent?.user || null
    };
  });

  // 将回复按照根一级评论分组
  const repliesByRootId = {};
  for (const reply of repliesWithReplyTo) {
    const rootId = findRootParentId(reply, allReplies);
    if (!repliesByRootId[rootId]) {
      repliesByRootId[rootId] = [];
    }
    repliesByRootId[rootId].push(reply);
  }

  // 组装最终结果
  const comments = topLevelComments.map(comment => ({
    ...comment,
    replies: repliesByRootId[comment.id] || []
  }));

  const totalPages = Math.ceil(total / pageSize);

  return {
    comments,
    pagination: {
      page,
      pageSize,
      total,
      totalPages
    }
  };
};

/**
 * 创建评论（支持文章评论和图片评论）
 * @param {string} userId - 用户ID
 * @param {Object} options - 评论选项
 * @param {string} options.articleId - 文章ID（可选）
 * @param {string} options.imageId - 图片ID（可选）
 * @param {string} options.content - 评论内容
 * @param {string} options.parentId - 父评论ID（可选）
 */
const createComment = async (userId, { articleId, imageId, content, parentId = null }) => {
  const data = {
    content,
    userId,
    parentId
  };

  if (articleId) {
    data.articleId = articleId;
  } else if (imageId) {
    data.imageId = imageId;
  }

  const comment = await prisma.comment.create({
    data,
    include: {
      user: {
        select: {
          id: true,
          username: true,
          avatarUrl: true
        }
      }
    }
  });

  return comment;
};

const deleteComment = async (userId, commentId, isAdmin = false) => {
  const comment = await prisma.comment.findUnique({
    where: { id: commentId }
  });

  if (!comment) {
    return null;
  }

  if (!isAdmin && comment.userId !== userId) {
    return null;
  }

  await prisma.comment.delete({
    where: { id: commentId }
  });

  return { id: commentId };
};

const getCommentById = async (commentId) => {
  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          avatarUrl: true
        }
      },
      article: {
        select: {
          id: true,
          title: true
        }
      }
    }
  });

  return comment;
};

module.exports = {
  getComments,
  createComment,
  deleteComment,
  getCommentById
};
