const path = require('path');
const fs = require('fs');
const { UPLOAD_DIRS } = require('../config/multer');

const createError = (statusCode, message) => {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
};

/**
 * 处理上传后的文件信息
 * @param {Object} file - multer 处理后的文件对象
 * @param {string} type - 上传类型 (avatar/cover)
 * @returns {Object} 上传结果
 */
const processUpload = (file, type = 'avatar') => {
  if (!file) {
    throw createError(400, '请选择要上传的文件');
  }

  // 构建相对 URL 路径
  let relativePath;
  switch (type) {
    case 'cover':
      relativePath = 'covers';
      break;
    case 'gallery':
      relativePath = 'gallery';
      break;
    case 'chat':
      relativePath = 'chat';
      break;
    default:
      relativePath = 'avatars';
  }
  const url = `/uploads/${relativePath}/${file.filename}`;

  return {
    url,
    filename: file.filename,
    originalName: file.originalname,
    size: file.size,
    mimetype: file.mimetype
  };
};

/**
 * 删除已上传的文件
 * @param {string} filename - 文件名
 * @param {string} type - 上传类型 (avatar/cover)
 * @returns {boolean} 是否删除成功
 */
const deleteFile = (filename, type = 'avatar') => {
  const uploadDir = UPLOAD_DIRS[type] || UPLOAD_DIRS.avatar;
  const filePath = path.join(uploadDir, filename);

  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    return true;
  }

  return false;
};

/**
 * 根据 URL 删除文件
 * @param {string} url - 文件 URL (如 /uploads/avatars/xxx.jpg)
 * @returns {boolean} 是否删除成功
 */
const deleteFileByUrl = (url) => {
  if (!url || !url.startsWith('/uploads/')) {
    return false;
  }

  const parts = url.split('/');
  if (parts.length < 4) {
    return false;
  }

  let type;
  switch (parts[2]) {
    case 'covers':
      type = 'cover';
      break;
    case 'gallery':
      type = 'gallery';
      break;
    case 'chat':
      type = 'chat';
      break;
    default:
      type = 'avatar';
  }
  const filename = parts[3];

  return deleteFile(filename, type);
};

module.exports = {
  processUpload,
  deleteFile,
  deleteFileByUrl
};