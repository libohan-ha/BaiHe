const express = require('express');
const router = express.Router();
const privateImageController = require('../controllers/privateImage.controller');
const { auth } = require('../middleware/auth.middleware');
const { uploadGallery } = require('../config/multer');
const uploadService = require('../services/upload.service');

// 所有隐私图片路由都需要认证
router.use(auth);

// 获取隐私图片列表
router.get('/', privateImageController.getPrivateImages);

// 获取隐私图片统计
router.get('/stats', privateImageController.getPrivateImageStats);

// 上传图片文件 - 仅上传，返回URL
router.post('/upload', uploadGallery.single('file'), (req, res, next) => {
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

// 批量从公开画廊转移图片
router.post('/transfer/batch', privateImageController.batchTransferFromGallery);

// 从公开画廊转移单张图片
router.post('/transfer/:imageId', privateImageController.transferFromGallery);

// 创建隐私图片 - 支持直接上传文件或传入URL
router.post('/', uploadGallery.single('file'), privateImageController.createPrivateImage);

// 获取单个隐私图片详情
router.get('/:id', privateImageController.getPrivateImageById);

// 更新隐私图片
router.put('/:id', privateImageController.updatePrivateImage);

// 删除隐私图片
router.delete('/:id', privateImageController.deletePrivateImage);

module.exports = router;