const adminAuth = require('../middleware/admin.middleware');
const {
  getTags,
  createTag,
  updateTag,
  deleteTag
} = require('../controllers/tag.controller');

const router = require('express').Router();

router.get('/', getTags);

router.post('/', adminAuth, createTag);

router.put('/:id', adminAuth, updateTag);

router.delete('/:id', adminAuth, deleteTag);

module.exports = router;
