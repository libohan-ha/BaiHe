const privateImageTagService = require('../services/privateImageTag.service');

/**
 * 获取用户的隐私图片标签列表
 */
const getPrivateImageTags = async (req, res, next) => {
  try {
    const { search, page, pageSize } = req.query;
    const result = await privateImageTagService.getPrivateImageTags(
      req.user.id,
      { search, page, pageSize }
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

/**
 * 获取用户的热门隐私图片标签
 */
const getPopularPrivateImageTags = async (req, res, next) => {
  try {
    const { limit } = req.query;
    const tags = await privateImageTagService.getPopularPrivateImageTags(
      req.user.id,
      limit ? parseInt(limit) : 10
    );

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
 * 获取单个隐私图片标签详情
 */
const getPrivateImageTagById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const tag = await privateImageTagService.getPrivateImageTagById(id, req.user.id);

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
 * 创建隐私图片标签
 */
const createPrivateImageTag = async (req, res, next) => {
  try {
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        code: 400,
        message: '标签名称不能为空',
        data: null
      });
    }

    const tag = await privateImageTagService.createPrivateImageTag(name.trim());

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
 * 更新隐私图片标签
 */
const updatePrivateImageTag = async (req, res, next) => {
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

    const tag = await privateImageTagService.updatePrivateImageTag(id, name.trim(), req.user.id);

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
 * 删除隐私图片标签
 */
const deletePrivateImageTag = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await privateImageTagService.deletePrivateImageTag(id);

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
  getPrivateImageTags,
  getPopularPrivateImageTags,
  getPrivateImageTagById,
  createPrivateImageTag,
  updatePrivateImageTag,
  deletePrivateImageTag
};