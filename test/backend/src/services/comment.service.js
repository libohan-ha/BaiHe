const prisma = require('../models/prisma');

const getComments = async (articleId, page = 1, pageSize = 10) => {
  const skip = (page - 1) * pageSize;

  // 获取一级评论
  const [topLevelComments, total] = await Promise.all([
    prisma.comment.findMany({
      where: {
        articleId,
        parentId: null
      },
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
      where: {
        articleId,
        parentId: null
      }
    })
  ]);

  // 获取所有一级评论的ID
  const topLevelIds = topLevelComments.map(c => c.id);

  // 获取这些一级评论下的所有回复（包括二级、三级等）
  // 先获取直接回复一级评论的二级评论
  const allReplies = await prisma.comment.findMany({
    where: {
      articleId,
      parentId: { not: null }
    },
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

const createComment = async (userId, articleId, content, parentId = null) => {
  const comment = await prisma.comment.create({
    data: {
      content,
      articleId,
      userId,
      parentId
    },
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
