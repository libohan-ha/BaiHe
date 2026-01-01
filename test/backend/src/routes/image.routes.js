const express = require('express');
const router = express.Router();
const imageController = require('../controllers/image.controller');
const { auth } = require('../middleware/auth.middleware');
const { uploadGallery } = require('../config/multer');
const uploadService = require('../services/upload.service');

// 公开路由
router.get('/', imageController.getImages);
router.get('/:id', imageController.getImageById);

// 上传图片文件（type=gallery）- 仅上传，返回URL
router.post('/upload', auth, uploadGallery.single('file'), (req, res, next) => {
  try {
    const result = uploadService.processUpload(req.file, 'gallery');
    res.json({
      code: 200,
      message: '上传成功',
      data: result
    });
  } catch (error) {
    next(error);
  }
});

// 创建图片 - 支持直接上传文件或传入URL
router.post('/', auth, uploadGallery.single('file'), imageController.createImage);

// 需要认证的路由
router.put('/:id', auth, imageController.updateImage);
router.delete('/:id', auth, imageController.deleteImage);

module.exports = router;