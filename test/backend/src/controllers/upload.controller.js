const uploadService = require('../services/upload.service');
const { success, error } = require('../utils/response');

/**
 * 上传文件
 * POST /api/upload, POST /api/upload/avatar, POST /api/upload/cover
 */
const uploadFile = async (req, res, next) => {
  try {
    // 优先使用路由设置的类型，其次是 body 中的类型
    const type = req.uploadType || req.body.type || 'avatar';

    const result = uploadService.processUpload(req.file, type);
    
    res.status(201).json(success(result, '上传成功'));
  } catch (err) {
    next(err);
  }
};

/**
 * 删除文件
 * DELETE /api/upload
 */
const deleteFile = async (req, res, next) => {
  try {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json(error('请提供要删除的文件 URL', 400));
    }

    const deleted = uploadService.deleteFileByUrl(url);
    
    if (!deleted) {
      return res.status(404).json(error('文件不存在或已被删除', 404));
    }

    res.json(success(null, '删除成功'));
  } catch (err) {
    next(err);
  }
};

module.exports = {
  uploadFile,
  deleteFile
};