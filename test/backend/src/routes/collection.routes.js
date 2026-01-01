const { auth } = require('../middleware/auth.middleware');
const {
  getCollections,
  createCollection,
  deleteCollection
} = require('../controllers/collection.controller');

const router = require('express').Router();

router.get('/', auth, getCollections);

router.post('/', auth, createCollection);

router.delete('/:id', auth, deleteCollection);

module.exports = router;
