const path = require('path');
const fs = require('fs');
const { UPLOAD_DIRS } = require('../config/multer');
const { createError } = require('../utils/errors');

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

  let url;
  if (type === 'private') {
    // 私有图片不放在公开静态目录，走鉴权路由访问
    url = `/api/private-images/file/${file.filename}`;
  } else {
    // 构建公开访问 URL 路径
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
    url = `/uploads/${relativePath}/${file.filename}`;
  }

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
  if (!filename || typeof filename !== 'string') {
    return false;
  }
  const safeFilename = path.basename(filename);
  if (safeFilename !== filename) {
    return false;
  }

  const uploadDir = UPLOAD_DIRS[type] || UPLOAD_DIRS.avatar;
  const filePath = path.join(uploadDir, safeFilename);

  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    return true;
  }

  return false;
};

/**
 * 解析上传文件 URL
 * @param {string} url
 * @returns {{ type: string, filename: string, pathname: string } | null}
 */
const parseUploadUrl = (url) => {
  if (!url || typeof url !== 'string') {
    return null;
  }

  let pathname = url;
  try {
    pathname = new URL(url, 'http://localhost').pathname;
  } catch {
    pathname = url;
  }

  if (pathname.startsWith('/api/private-images/file/')) {
    const filename = pathname.split('/').pop();
    if (!filename) return null;
    return { type: 'private', filename, pathname };
  }

  if (!pathname.startsWith('/uploads/')) {
    return null;
  }

  const parts = pathname.split('/');
  if (parts.length < 4) return null;

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
    case 'private':
      type = 'private';
      break;
    case 'avatars':
      type = 'avatar';
      break;
    default:
      return null;
  }

  const filename = parts[3];
  if (!filename) return null;
  return { type, filename, pathname };
};

/**
 * 根据 URL 删除文件
 * @param {string} url - 文件 URL (如 /uploads/avatars/xxx.jpg)
 * @returns {boolean} 是否删除成功
 */
const deleteFileByUrl = (url) => {
  const parsed = parseUploadUrl(url);
  if (!parsed) {
    return false;
  }
  return deleteFile(parsed.filename, parsed.type);
};

module.exports = {
  processUpload,
  deleteFile,
  deleteFileByUrl,
  parseUploadUrl
};
