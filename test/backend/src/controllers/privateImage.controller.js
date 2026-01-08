const privateImageService = require('../services/privateImage.service');
const uploadService = require('../services/upload.service');
const { mapPrivateImageFields, mapPrivateImageList } = require('../utils/imageResponse');

/**
 * 获取当前用户的隐私图片列表
 */
const getPrivateImages = async (req, res, next) => {
  try {
    const { page, pageSize, tag, search, sort } = req.query;
    const result = await privateImageService.getPrivateImages(
      req.user.id,
      { page, pageSize, tag, search, sort }
    );
    const formatted = {
      ...result,
      images: mapPrivateImageList(result.images)
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
 * 获取单个隐私图片详情
 */
const getPrivateImageById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const image = await privateImageService.getPrivateImageById(id, req.user.id);

    if (!image) {
      return res.status(404).json({
        code: 404,
        message: '隐私图片不存在',
        data: null
      });
    }

    res.json({
      code: 200,
      message: 'success',
      data: mapPrivateImageFields(image)
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 创建隐私图片
 * 支持两种方式：
 * 1. 直接上传文件（multipart/form-data，包含 file 字段）
 * 2. 传入 URL（application/json，包含 url 或 imageUrl 字段）
 */
const createPrivateImage = async (req, res, next) => {
  try {
    let { title, description, url, imageUrl, thumbnailUrl, width, height, size, tags, tagIds } = req.body;

    // 支持 imageUrl 和 url 两种字段名
    url = url || imageUrl;
    // 支持 tags 和 tagIds 两种字段名
    tags = tags || tagIds;

    if (!title) {
      return res.status(400).json({
        code: 400,
        message: '图片标题不能为空',
        data: null
      });
    }

    // 如果有上传的文件，处理文件并获取URL
    if (req.file) {
      const uploadResult = uploadService.processUpload(req.file, 'gallery');
      url = uploadResult.url;
      size = uploadResult.size;
    }

    if (!url) {
      return res.status(400).json({
        code: 400,
        message: '图片URL不能为空',
        data: null
      });
    }

    const image = await privateImageService.createPrivateImage(
      { title, description, url, thumbnailUrl, width, height, size, tags },
      req.user.id
    );

    res.status(201).json({
      code: 200,
      message: '创建成功',
      data: mapPrivateImageFields(image)
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 更新隐私图片
 */
const updatePrivateImage = async (req, res, next) => {
  try {
    const { id } = req.params;
    let { title, description, url, imageUrl, thumbnailUrl, tags, tagIds } = req.body;

    // 支持 imageUrl 和 url 两种字段名
    url = url || imageUrl;
    // 支持 tags 和 tagIds 两种字段名
    tags = tags || tagIds;

    const image = await privateImageService.updatePrivateImage(
      id,
      { title, description, url, thumbnailUrl, tags },
      req.user.id
    );

    if (!image) {
      return res.status(404).json({
        code: 404,
        message: '隐私图片不存在',
        data: null
      });
    }

    res.json({
      code: 200,
      message: '更新成功',
      data: mapPrivateImageFields(image)
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 删除隐私图片
 */
const deletePrivateImage = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await privateImageService.deletePrivateImage(id, req.user.id);

    if (!result) {
      return res.status(404).json({
        code: 404,
        message: '隐私图片不存在',
        data: null
      });
    }

    // 尝试删除文件
    if (result.url) {
      uploadService.deleteFileByUrl(result.url);
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

/**
 * 从公开画廊转移单张图片到隐私相册
 */
const transferFromGallery = async (req, res, next) => {
  try {
    const { imageId } = req.params;

    const privateImage = await privateImageService.transferFromGallery(imageId, req.user.id);

    res.json({
      code: 200,
      message: '转移成功',
      data: mapPrivateImageFields(privateImage)
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 批量从公开画廊转移图片到隐私相册
 */
const batchTransferFromGallery = async (req, res, next) => {
  try {
    const { imageIds } = req.body;

    if (!imageIds || !Array.isArray(imageIds) || imageIds.length === 0) {
      return res.status(400).json({
        code: 400,
        message: '请选择要转移的图片',
        data: null
      });
    }

    const results = await privateImageService.batchTransferFromGallery(imageIds, req.user.id);

    res.json({
      code: 200,
      message: `成功转移 ${results.success.length} 张图片${results.failed.length > 0 ? `，失败 ${results.failed.length} 张` : ''}`,
      data: results
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 获取隐私图片统计信息
 */
const getPrivateImageStats = async (req, res, next) => {
  try {
    const stats = await privateImageService.getPrivateImageStats(req.user.id);

    res.json({
      code: 200,
      message: 'success',
      data: stats
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPrivateImages,
  getPrivateImageById,
  createPrivateImage,
  updatePrivateImage,
  deletePrivateImage,
  transferFromGallery,
  batchTransferFromGallery,
  getPrivateImageStats
};