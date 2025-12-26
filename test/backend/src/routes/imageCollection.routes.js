const express = require('express');
const router = express.Router();
const imageCollectionController = require('../controllers/imageCollection.controller');
const { auth } = require('../middleware/auth.middleware');

// 所有路由都需要认证
router.use(auth);

// 获取用户收藏的图片列表
router.get('/', imageCollectionController.getCollections);

// 添加图片收藏
router.post('/', imageCollectionController.addCollection);

// 检查是否已收藏某图片
router.get('/check/:imageId', imageCollectionController.checkCollection);

// 取消图片收藏（通过收藏ID）
router.delete('/:id', imageCollectionController.removeCollection);

// 取消图片收藏（通过图片ID）
router.delete('/image/:imageId', imageCollectionController.removeCollectionByImageId);

module.exports = router;