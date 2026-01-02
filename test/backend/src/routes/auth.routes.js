const { body } = require('express-validator');
const { auth } = require('../middleware/auth.middleware');
const validator = require('../middleware/validator');
const {
  register,
  login,
  getProfile,
  updateProfile,
  updatePassword
} = require('../controllers/auth.controller');

const router = require('express').Router();

router.post('/register', [
  body('email').isEmail().withMessage('请输入有效的邮箱地址'),
  body('username').isLength({ min: 2, max: 20 }).withMessage('用户名长度2-20位'),
  body('password').isLength({ min: 6 }).withMessage('密码长度至少6位'),
  validator
], register);

router.post('/login', [
  body('password').notEmpty().withMessage('密码不能为空'),
  // 验证 identifier 或 email 字段（兼容新旧版本）
  body().custom((value, { req }) => {
    const identifier = req.body.identifier || req.body.email;
    if (!identifier || identifier.trim() === '') {
      throw new Error('邮箱/用户名不能为空');
    }
    return true;
  }),
  validator
], login);

router.get('/profile', auth, getProfile);

router.put('/profile', auth, [
  body('username').optional().isLength({ min: 2, max: 20 }).withMessage('用户名长度2-20位'),
  body('bio').optional().isString().withMessage('个人简介必须是字符串'),
  body('avatarUrl').optional().custom((value) => {
    // 允许相对路径（以 / 开头）或完整 URL
    if (value.startsWith('/') || value.startsWith('http://') || value.startsWith('https://')) {
      return true;
    }
    throw new Error('头像地址必须是有效的URL或相对路径');
  }),
  validator
], updateProfile);

router.put('/password', auth, [
  body('oldPassword').notEmpty().withMessage('原密码不能为空'),
  body('newPassword').isLength({ min: 6 }).withMessage('新密码长度至少6位'),
  validator
], updatePassword);

module.exports = router;
