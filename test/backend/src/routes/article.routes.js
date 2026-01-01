const { auth, optionalAuth } = require('../middleware/auth.middleware');
const { body } = require('express-validator');
const validator = require('../middleware/validator');
const {
  getArticles,
  getArticleById,
  createArticle,
  updateArticle,
  deleteArticle,
  getRelatedArticles
} = require('../controllers/article.controller');

const router = require('express').Router();

router.get('/', getArticles);

router.get('/related/:id', getRelatedArticles);

router.get('/:id', optionalAuth, getArticleById);

router.post('/', auth, [
  body('title').notEmpty().withMessage('标题不能为空'),
  body('summary').optional(),
  body('content').notEmpty().withMessage('内容不能为空'),
  validator
], createArticle);

router.put('/:id', auth, updateArticle);

router.delete('/:id', auth, deleteArticle);

module.exports = router;
