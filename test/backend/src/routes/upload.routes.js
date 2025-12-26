const express = require('express');
const { auth } = require('../middleware/auth.middleware');
const { upload, uploadAvatar, uploadCover, uploadGallery } = require('../config/multer');
const { uploadFile, deleteFile } = require('../controllers/upload.controller');

const router = express.Router();

/**
 * POST /api/upload/avatar
 * 上传头像（需要登录）
 * Content-Type: multipart/form-data
 * 参数:
 *   - file: 文件
 */
router.post('/avatar', auth, uploadAvatar.single('file'), (req, res, next) => {
  if (req.fileValidationError) {
    return res.status(400).json({
      code: 400,
      message: req.fileValidationError,
      data: null
    });
  }
  next();
}, uploadFile);

/**
 * POST /api/upload/cover
 * 上传封面（需要登录）
 * Content-Type: multipart/form-data
 * 参数:
 *   - file: 文件
 */
router.post('/cover', auth, uploadCover.single('file'), (req, res, next) => {
  if (req.fileValidationError) {
    return res.status(400).json({
      code: 400,
      message: req.fileValidationError,
      data: null
    });
  }
  next();
}, uploadFile);

/**
 * POST /api/upload/gallery
 * 上传图库图片（需要登录）
 * Content-Type: multipart/form-data
 * 参数:
 *   - file: 文件
 */
router.post('/gallery', auth, uploadGallery.single('file'), (req, res, next) => {
  if (req.fileValidationError) {
    return res.status(400).json({
      code: 400,
      message: req.fileValidationError,
      data: null
    });
  }
  next();
}, uploadFile);

/**
 * POST /api/upload
 * 通用上传文件（需要登录）- 默认上传到 avatars
 * Content-Type: multipart/form-data
 * 参数:
 *   - file: 文件
 */
router.post('/', auth, upload.single('file'), (req, res, next) => {
  if (req.fileValidationError) {
    return res.status(400).json({
      code: 400,
      message: req.fileValidationError,
      data: null
    });
  }
  next();
}, uploadFile);

/**
 * DELETE /api/upload
 * 删除已上传的文件（需要登录）
 * 参数:
 *   - url: 文件 URL
 */
router.delete('/', auth, deleteFile);

// Multer 错误处理中间件
router.use((err, req, res, next) => {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      code: 400,
      message: '文件大小不能超过 5MB',
      data: null
    });
  }
  if (err.message) {
    return res.status(400).json({
      code: 400,
      message: err.message,
      data: null
    });
  }
  next(err);
});

module.exports = router;