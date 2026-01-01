const collectionService = require('../services/collection.service');
const { success, error } = require('../utils/response');

const getCollections = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const result = await collectionService.getCollections(req.user.id, page, pageSize);
    res.json(success(result, '获取成功'));
  } catch (err) {
    next(err);
  }
};

const createCollection = async (req, res, next) => {
  try {
    const { articleId } = req.body;
    if (!articleId || articleId === 'undefined' || articleId === 'null') {
      return res.status(400).json(error('文章ID不能为空', 400));
    }

    const collection = await collectionService.createCollection(req.user.id, articleId);
    if (!collection) {
      return res.status(400).json(error('已经收藏过该文章', 400));
    }
    res.status(201).json(success(collection, '收藏成功'));
  } catch (err) {
    next(err);
  }
};

const deleteCollection = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id || id === 'undefined' || id === 'null') {
      return res.status(400).json(error('收藏ID无效', 400));
    }

    const result = await collectionService.deleteCollection(req.user.id, id);
    if (!result) {
      return res.status(404).json(error('收藏不存在', 404));
    }
    res.json(success(result, '取消收藏成功'));
  } catch (err) {
    next(err);
  }
};

const deleteCollectionByArticle = async (req, res, next) => {
  try {
    const { articleId } = req.body;
    if (!articleId || articleId === 'undefined' || articleId === 'null') {
      return res.status(400).json(error('文章ID不能为空', 400));
    }

    const result = await collectionService.deleteCollectionByArticle(req.user.id, articleId);
    if (!result) {
      return res.status(404).json(error('收藏不存在', 404));
    }
    res.json(success(result, '取消收藏成功'));
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getCollections,
  createCollection,
  deleteCollection,
  deleteCollectionByArticle
};
