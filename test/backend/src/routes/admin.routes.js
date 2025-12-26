const { auth, superAdmin } = require('../middleware/auth.middleware');
const adminAuth = require('../middleware/admin.middleware');
const adminPanelController = require('../controllers/adminPanel.controller');
const imageController = require('../controllers/image.controller');
const {
  getAdmins,
  createAdmin,
  updateAdmin,
  deleteAdmin
} = require('../controllers/admin.controller');

const router = require('express').Router();

const superAdminAuth = [auth, superAdmin];

router.get('/', ...superAdminAuth, getAdmins);

router.get('/users', ...adminAuth, adminPanelController.getUsers);
router.put('/users/:id/role', ...adminAuth, adminPanelController.updateUserRole);
router.delete('/users/:id', ...adminAuth, adminPanelController.deleteUser);

router.get('/articles', ...adminAuth, adminPanelController.getArticles);
router.put('/articles/:id/status', ...adminAuth, adminPanelController.updateArticleStatus);
router.delete('/articles/:id', ...adminAuth, adminPanelController.deleteArticle);

// 管理员图片接口
router.get('/images', ...adminAuth, imageController.getAllImages);
router.delete('/images/:id', ...adminAuth, imageController.adminDeleteImage);

router.post('/', ...superAdminAuth, createAdmin);

router.put('/:id', ...superAdminAuth, updateAdmin);

router.delete('/:id', ...superAdminAuth, deleteAdmin);

module.exports = router;
