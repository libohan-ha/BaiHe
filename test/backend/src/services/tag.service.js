const prisma = require('../models/prisma');
const { createError } = require('../utils/errors');

const getTags = async () => {
  const tags = await prisma.tag.findMany({
    include: {
      _count: {
        select: {
          articles: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  return { tags };
};

const createTag = async (name) => {
  const existing = await prisma.tag.findUnique({
    where: { name }
  });
  if (existing) {
    throw createError(409, '标签已存在');
  }

  const tag = await prisma.tag.create({
    data: { name }
  });

  return tag;
};

const updateTag = async (id, name) => {
  const tag = await prisma.tag.findUnique({
    where: { id }
  });

  if (!tag) {
    return null;
  }

  const existing = await prisma.tag.findUnique({
    where: { name }
  });
  if (existing && existing.id !== id) {
    throw createError(409, '标签已存在');
  }

  const updated = await prisma.tag.update({
    where: { id },
    data: { name }
  });

  return updated;
};

const deleteTag = async (id) => {
  const tag = await prisma.tag.findUnique({
    where: { id }
  });

  if (!tag) {
    return null;
  }

  await prisma.tag.delete({
    where: { id }
  });

  return { id };
};

module.exports = {
  getTags,
  createTag,
  updateTag,
  deleteTag
};
