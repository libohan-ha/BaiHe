const { auth, optionalAuth } = require('../middleware/auth.middleware');
const { body } = require('express-validator');
const validator = require('../middleware/validator');
const {
  getComments,
  createComment,
  deleteComment
} = require('../controllers/comment.controller');

const router = require('express').Router();

router.get('/', optionalAuth, getComments);

// 自定义验证：articleId 和 imageId 至少有一个
const validateTarget = (value, { req }) => {
  if (!req.body.articleId && !req.body.imageId) {
    throw new Error('文章ID或图片ID不能为空');
  }
  return true;
};

router.post('/', auth, [
  body('content').notEmpty().withMessage('评论内容不能为空'),
  body('articleId').optional().isString().withMessage('文章ID格式错误'),
  body('imageId').optional().isString().withMessage('图片ID格式错误'),
  body('articleId').custom(validateTarget),
  validator
], createComment);

router.delete('/:id', auth, deleteComment);

module.exports = router;
