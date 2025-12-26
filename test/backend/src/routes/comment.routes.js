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

router.post('/', auth, [
  body('content').notEmpty().withMessage('评论内容不能为空'),
  body('articleId').notEmpty().withMessage('文章ID不能为空'),
  validator
], createComment);

router.delete('/:id', auth, deleteComment);

module.exports = router;
