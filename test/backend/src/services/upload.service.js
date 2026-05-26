const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const { UPLOAD_DIRS } = require('../config/multer');
const { createError } = require('../utils/errors');

const THUMBNAIL_WIDTH = 480;
const THUMBNAIL_QUALITY = 72;
const THUMBNAIL_SUFFIX = '_thumb.webp';
const THUMBNAIL_TYPES = new Set(['gallery', 'private', 'cover', 'chat']);

const getPublicFolder = (type) => {
  switch (type) {
    case 'cover':
      return 'covers';
    case 'gallery':
      return 'gallery';
    case 'chat':
      return 'chat';
    default:
      return 'avatars';
  }
};

const getThumbnailFilename = (filename) => {
  const ext = path.extname(filename);
  const base = ext ? filename.slice(0, -ext.length) : filename;
  return `${base}${THUMBNAIL_SUFFIX}`;
};

const buildUploadUrl = (filename, type = 'avatar') => {
  if (type === 'private') {
    return `/api/private-images/file/${filename}`;
  }
  return `/uploads/${getPublicFolder(type)}/${filename}`;
};

const createThumbnail = async (file, type) => {
  if (!file || !THUMBNAIL_TYPES.has(type)) return null;

  const thumbnailFilename = getThumbnailFilename(file.filename);
  const thumbnailPath = path.join(path.dirname(file.path), thumbnailFilename);

  try {
    await sharp(file.path, { animated: false })
      .rotate()
      .resize({ width: THUMBNAIL_WIDTH, withoutEnlargement: true })
      .webp({ quality: THUMBNAIL_QUALITY })
      .toFile(thumbnailPath);

    return {
      filename: thumbnailFilename,
      url: buildUploadUrl(thumbnailFilename, type)
    };
  } catch (error) {
    console.warn('生成缩略图失败:', file.filename, error.message);
    return null;
  }
};

const processUpload = async (file, type = 'avatar') => {
  if (!file) {
    throw createError(400, '请选择要上传的文件');
  }

  const thumbnail = await createThumbnail(file, type);

  return {
    url: buildUploadUrl(file.filename, type),
    thumbnailUrl: thumbnail?.url,
    thumbnailFilename: thumbnail?.filename,
    filename: file.filename,
    originalName: file.originalname,
    size: file.size,
    mimetype: file.mimetype
  };
};

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

const deleteFileByUrl = (url) => {
  const parsed = parseUploadUrl(url);
  if (!parsed) {
    return false;
  }

  const deletedOriginal = deleteFile(parsed.filename, parsed.type);
  const deletedThumbnail = deleteFile(getThumbnailFilename(parsed.filename), parsed.type);
  return deletedOriginal || deletedThumbnail;
};

module.exports = {
  processUpload,
  deleteFile,
  deleteFileByUrl,
  parseUploadUrl,
  getThumbnailFilename,
  buildUploadUrl
};
