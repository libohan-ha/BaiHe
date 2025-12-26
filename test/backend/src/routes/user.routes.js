const { auth } = require('../middleware/auth.middleware');
const { body } = require('express-validator');
const validator = require('../middleware/validator');
const {
  getProfile,
  updateProfile,
  getUserById,
  getUserArticles,
  getUserCollections
} = require('../controllers/user.controller');
const imageController = require('../controllers/image.controller');

const router = require('express').Router();

router.get('/profile', auth, getProfile);

router.put('/profile', auth, [
  body('username').optional().isLength({ min: 2, max: 20 }),
  body('bio').optional().isString(),
  validator
], updateProfile);

router.get('/:id', getUserById);

router.get('/:id/articles', getUserArticles);

router.get('/:id/collections', auth, getUserCollections);

// 获取用户的图片列表
router.get('/:id/images', imageController.getUserImages);

module.exports = router;
