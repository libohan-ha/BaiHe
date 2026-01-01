const prisma = require('../models/prisma');

const toCollectionItem = (collection) => {
  return {
    id: collection.id,
    articleId: collection.articleId,
    collectedAt: collection.createdAt,
    article: collection.article
  };
};

const getCollections = async (userId, page = 1, pageSize = 10) => {
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
    .map(toCollectionItem);

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

const createCollection = async (userId, articleId) => {
  const existing = await prisma.collection.findUnique({
    where: {
      userId_articleId: {
        userId,
        articleId
      }
    }
  });

  if (existing) {
    return null;
  }

  const collection = await prisma.collection.create({
    data: {
      userId,
      articleId
    },
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
    }
  });

  return toCollectionItem(collection);
};

const deleteCollection = async (userId, collectionId) => {
  const collection = await prisma.collection.findFirst({
    where: {
      id: collectionId,
      userId
    }
  });

  if (!collection) {
    return null;
  }

  await prisma.collection.delete({
    where: { id: collectionId }
  });

  return { id: collectionId };
};

const deleteCollectionByArticle = async (userId, articleId) => {
  const collection = await prisma.collection.findUnique({
    where: {
      userId_articleId: {
        userId,
        articleId
      }
    }
  });

  if (!collection) {
    return null;
  }

  await prisma.collection.delete({
    where: {
      userId_articleId: {
        userId,
        articleId
      }
    }
  });

  return { articleId };
};

module.exports = {
  getCollections,
  createCollection,
  deleteCollection,
  deleteCollectionByArticle
};
