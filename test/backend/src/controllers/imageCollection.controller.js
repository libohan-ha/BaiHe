const imageCollectionService = require('../services/imageCollection.service');
const { mapImageFields } = require('../utils/imageResponse');

/**
 * 获取用户收藏的图片列表
 */
const getCollections = async (req, res, next) => {
  try {
    const { page, pageSize } = req.query;
    const result = await imageCollectionService.getCollections(req.user.id, { page, pageSize });
    const collections = Array.isArray(result.collections)
      ? result.collections.map((collection) => ({
          ...collection,
          image: mapImageFields(collection.image)
        }))
      : result.collections;

    res.json({
      code: 200,
      message: 'success',
      data: {
        ...result,
        collections
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 添加图片收藏
 */
const addCollection = async (req, res, next) => {
  try {
    const { imageId } = req.body;

    if (!imageId) {
      return res.status(400).json({
        code: 400,
        message: '图片ID不能为空',
        data: null
      });
    }

    const collection = await imageCollectionService.addCollection(req.user.id, imageId);

    res.status(201).json({
      code: 200,
      message: '收藏成功',
      data: collection
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 取消图片收藏（通过收藏ID）
 */
const removeCollection = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await imageCollectionService.removeCollection(req.user.id, id);

    res.json({
      code: 200,
      message: '取消收藏成功',
      data: null
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 取消图片收藏（通过图片ID）
 */
const removeCollectionByImageId = async (req, res, next) => {
  try {
    const { imageId } = req.params;
    const result = await imageCollectionService.removeCollectionByImageId(req.user.id, imageId);

    res.json({
      code: 200,
      message: '取消收藏成功',
      data: null
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 检查用户是否已收藏某图片
 */
const checkCollection = async (req, res, next) => {
  try {
    const { imageId } = req.params;
    const result = await imageCollectionService.checkCollection(req.user.id, imageId);

    res.json({
      code: 200,
      message: 'success',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCollections,
  addCollection,
  removeCollection,
  removeCollectionByImageId,
  checkCollection
};
