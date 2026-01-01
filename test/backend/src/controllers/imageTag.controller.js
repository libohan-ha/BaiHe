const imageTagService = require('../services/imageTag.service');

/**
 * 获取图片标签列表
 */
const getImageTags = async (req, res, next) => {
  try {
    const { search, page, pageSize } = req.query;
    const result = await imageTagService.getImageTags({ search, page, pageSize });

    res.json({
      code: 200,
      message: 'success',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 获取热门图片标签
 */
const getPopularImageTags = async (req, res, next) => {
  try {
    const { limit } = req.query;
    const tags = await imageTagService.getPopularImageTags(limit ? parseInt(limit) : 10);

    res.json({
      code: 200,
      message: 'success',
      data: tags
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 获取单个图片标签
 */
const getImageTagById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const tag = await imageTagService.getImageTagById(id);

    if (!tag) {
      return res.status(404).json({
        code: 404,
        message: '标签不存在',
        data: null
      });
    }

    res.json({
      code: 200,
      message: 'success',
      data: tag
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 创建图片标签
 */
const createImageTag = async (req, res, next) => {
  try {
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        code: 400,
        message: '标签名称不能为空',
        data: null
      });
    }

    const tag = await imageTagService.createImageTag(name.trim());

    res.status(201).json({
      code: 200,
      message: '创建成功',
      data: tag
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 更新图片标签
 */
const updateImageTag = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        code: 400,
        message: '标签名称不能为空',
        data: null
      });
    }

    const tag = await imageTagService.updateImageTag(id, name.trim());

    if (!tag) {
      return res.status(404).json({
        code: 404,
        message: '标签不存在',
        data: null
      });
    }

    res.json({
      code: 200,
      message: '更新成功',
      data: tag
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 删除图片标签
 */
const deleteImageTag = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await imageTagService.deleteImageTag(id);

    if (!result) {
      return res.status(404).json({
        code: 404,
        message: '标签不存在',
        data: null
      });
    }

    res.json({
      code: 200,
      message: '删除成功',
      data: null
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getImageTags,
  getPopularImageTags,
  getImageTagById,
  createImageTag,
  updateImageTag,
  deleteImageTag
};