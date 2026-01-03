const express = require('express');
const router = express.Router();
const privateImageTagController = require('../controllers/privateImageTag.controller');
const { auth } = require('../middleware/auth.middleware');

// 所有隐私图片标签路由都需要认证
router.use(auth);

// 获取标签列表
router.get('/', privateImageTagController.getPrivateImageTags);

// 获取热门标签
router.get('/popular', privateImageTagController.getPopularPrivateImageTags);

// 获取单个标签详情
router.get('/:id', privateImageTagController.getPrivateImageTagById);

// 创建标签
router.post('/', privateImageTagController.createPrivateImageTag);

// 更新标签
router.put('/:id', privateImageTagController.updatePrivateImageTag);

// 删除标签
router.delete('/:id', privateImageTagController.deletePrivateImageTag);

module.exports = router;