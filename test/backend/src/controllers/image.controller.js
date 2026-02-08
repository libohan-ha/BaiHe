const imageService = require('../services/image.service');
const uploadService = require('../services/upload.service');
const { mapImageFields, mapImageList } = require('../utils/imageResponse');

/**
 * 获取图片列表
 */
const getImages = async (req, res, next) => {
  try {
    const { page, pageSize, tag, search, sort } = req.query;
    const result = await imageService.getImages({ page, pageSize, tag, search, sort });
    const formatted = {
      ...result,
      images: mapImageList(result.images)
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
 * 获取单个图片详情
 */
const getImageById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const image = await imageService.getImageById(id);

    if (!image) {
      return res.status(404).json({
        code: 404,
        message: '图片不存在',
        data: null
      });
    }

    res.json({
      code: 200,
      message: 'success',
      data: mapImageFields(image)
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 创建图片
 * 支持两种方式：
 * 1. 直接上传文件（multipart/form-data，包含 file 字段）
 * 2. 传入 URL（application/json，包含 url 或 imageUrl 字段）
 */
const createImage = async (req, res, next) => {
  try {
    let { title, description, url, imageUrl, thumbnailUrl, width, height, size, tags, tagIds } = req.body;

    // 支持 imageUrl 和 url 两种字段名
    url = url || imageUrl;
    // 支持 tags 和 tagIds 两种字段名
    tags = tags || tagIds;
    const normalizedTitle = typeof title === 'string' ? title.trim() : '';
    const normalizedDescription = typeof description === 'string' && description.trim()
      ? description.trim()
      : undefined;

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

    const image = await imageService.createImage(
      {
        title: normalizedTitle,
        description: normalizedDescription,
        url,
        thumbnailUrl,
        width,
        height,
        size,
        tags
      },
      req.user.id
    );

    res.status(201).json({
      code: 200,
      message: '创建成功',
      data: mapImageFields(image)
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 更新图片
 */
const updateImage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, thumbnailUrl, tags } = req.body;
    const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(req.user.role);

    const image = await imageService.updateImage(
      id,
      { title, description, thumbnailUrl, tags },
      req.user.id,
      isAdmin
    );

    if (!image) {
      return res.status(404).json({
        code: 404,
        message: '图片不存在',
        data: null
      });
    }

    res.json({
      code: 200,
      message: '更新成功',
      data: mapImageFields(image)
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 删除图片
 */
const deleteImage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(req.user.role);

    const result = await imageService.deleteImage(id, req.user.id, isAdmin);

    if (!result) {
      return res.status(404).json({
        code: 404,
        message: '图片不存在',
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
 * 获取用户的图片列表
 */
const getUserImages = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { page, pageSize } = req.query;
    const result = await imageService.getUserImages(id, { page, pageSize });
    const formatted = {
      ...result,
      images: mapImageList(result.images)
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
 * 管理员获取所有图片
 */
const getAllImages = async (req, res, next) => {
  try {
    const { page, pageSize, uploaderId, search } = req.query;
    const result = await imageService.getAllImages({ page, pageSize, uploaderId, search });
    const formatted = {
      ...result,
      images: mapImageList(result.images)
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
 * 管理员删除图片
 */
const adminDeleteImage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await imageService.adminDeleteImage(id);

    if (!result) {
      return res.status(404).json({
        code: 404,
        message: '图片不存在',
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

module.exports = {
  getImages,
  getImageById,
  createImage,
  updateImage,
  deleteImage,
  getUserImages,
  getAllImages,
  adminDeleteImage
};
