const privateImageCollectionService = require('../services/privateImageCollection.service');
const { mapPrivateImageFields } = require('../utils/imageResponse');

/**
 * 获取用户收藏的隐私图片列表
 */
const getCollections = async (req, res, next) => {
  try {
    const { page, pageSize } = req.query;
    const result = await privateImageCollectionService.getCollections(
      req.user.id,
      { page, pageSize }
    );

    // 映射图片字段
    const formatted = {
      ...result,
      collections: result.collections.map(c => ({
        ...c,
        image: mapPrivateImageFields(c.image)
      }))
    };

    res.json({
      code: 200,
      message: 'success',
      data: formatted
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 添加隐私图片收藏
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

    const collection = await privateImageCollectionService.addCollection(
      req.user.id,
      imageId
    );

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
 * 取消隐私图片收藏（通过收藏ID）
 */
const removeCollection = async (req, res, next) => {
  try {
    const { id } = req.params;

    await privateImageCollectionService.removeCollection(req.user.id, id);

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
 * 取消隐私图片收藏（通过图片ID）
 */
const removeCollectionByImageId = async (req, res, next) => {
  try {
    const { imageId } = req.params;

    await privateImageCollectionService.removeCollectionByImageId(
      req.user.id,
      imageId
    );

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
 * 检查是否已收藏某隐私图片
 */
const checkCollection = async (req, res, next) => {
  try {
    const { imageId } = req.params;

    const result = await privateImageCollectionService.checkCollection(
      req.user.id,
      imageId
    );

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