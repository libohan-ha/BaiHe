const express = require('express');
const router = express.Router();
const imageTagController = require('../controllers/imageTag.controller');
const { auth, admin } = require('../middleware/auth.middleware');

// 公开路由
router.get('/', imageTagController.getImageTags);
router.get('/popular', imageTagController.getPopularImageTags);
router.get('/:id', imageTagController.getImageTagById);

// 需要认证的路由
router.post('/', auth, imageTagController.createImageTag);

// 管理员路由
router.put('/:id', auth, admin, imageTagController.updateImageTag);
router.delete('/:id', auth, admin, imageTagController.deleteImageTag);

module.exports = router;