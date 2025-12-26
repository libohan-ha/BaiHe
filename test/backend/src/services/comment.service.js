const prisma = require('../models/prisma');

const getComments = async (articleId, page = 1, pageSize = 10) => {
  const skip = (page - 1) * pageSize;

  const [comments, total] = await Promise.all([
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
        },
        replies: {
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
            createdAt: 'asc'
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
