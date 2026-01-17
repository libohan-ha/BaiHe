const articleService = require('../services/article.service');
const { success, error } = require('../utils/response');

const getArticles = async (req, res, next) => {
  try {
    const result = await articleService.getArticles(req.query);
    res.json(success(result, '获取成功'));
  } catch (err) {
    next(err);
  }
};

const getArticleById = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id || id === 'undefined' || id === 'null') {
      return res.status(400).json(error('文章ID无效', 400));
    }

    const article = await articleService.getArticleById(id);
    if (!article) {
      return res.status(404).json(error('文章不存在', 404));
    }
    res.json(success(article, '获取成功'));
  } catch (err) {
    next(err);
  }
};

const createArticle = async (req, res, next) => {
  try {
    const article = await articleService.createArticle(req.body, req.user.id);
    res.status(201).json(success(article, '创建成功'));
  } catch (err) {
    next(err);
  }
};

const updateArticle = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id || id === 'undefined' || id === 'null') {
      return res.status(400).json(error('文章ID无效', 400));
    }

    const isAdmin = req.user.role === 'ADMIN' || req.user.role === 'SUPER_ADMIN';
    const article = await articleService.updateArticle(
      id,
      req.body,
      req.user.id,
      isAdmin
    );
    if (!article) {
      return res.status(404).json(error('文章不存在', 404));
    }
    res.json(success(article, '更新成功'));
  } catch (err) {
    next(err);
  }
};

const deleteArticle = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id || id === 'undefined' || id === 'null') {
      return res.status(400).json(error('文章ID无效', 400));
    }

    const isAdmin = req.user.role === 'ADMIN' || req.user.role === 'SUPER_ADMIN';
    const result = await articleService.deleteArticle(
      id,
      req.user.id,
      isAdmin
    );
    if (!result) {
      return res.status(404).json(error('文章不存在', 404));
    }
    res.json(success(null, '删除成功'));
  } catch (err) {
    next(err);
  }
};

const getRelatedArticles = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id || id === 'undefined' || id === 'null') {
      return res.status(400).json(error('文章ID无效', 400));
    }

    const result = await articleService.getRelatedArticles(req.params.id);
    res.json(success(result, '获取成功'));
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getArticles,
  getArticleById,
  createArticle,
  updateArticle,
  deleteArticle,
  getRelatedArticles
};
