const express = require('express');
const router = express.Router();
const privateImageCollectionController = require('../controllers/privateImageCollection.controller');
const { auth } = require('../middleware/auth.middleware');

// 所有路由都需要认证
router.use(auth);

// 获取用户收藏的隐私图片列表
router.get('/', privateImageCollectionController.getCollections);

// 添加隐私图片收藏
router.post('/', privateImageCollectionController.addCollection);

// 检查是否已收藏某隐私图片
router.get('/check/:imageId', privateImageCollectionController.checkCollection);

// 取消隐私图片收藏（通过收藏ID）
router.delete('/:id', privateImageCollectionController.removeCollection);

// 取消隐私图片收藏（通过图片ID）
router.delete('/image/:imageId', privateImageCollectionController.removeCollectionByImageId);

module.exports = router;