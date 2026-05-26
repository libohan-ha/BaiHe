const path = require('path');
const fs = require('fs');
const { UPLOAD_DIRS } = require('../config/multer');
const { parseUploadUrl, getThumbnailFilename, buildUploadUrl } = require('../services/upload.service');

const getExistingThumbnailUrl = (url) => {
  const parsed = parseUploadUrl(url);
  if (!parsed) return undefined;

  const thumbnailFilename = getThumbnailFilename(parsed.filename);
  const uploadDir = UPLOAD_DIRS[parsed.type] || UPLOAD_DIRS.avatar;
  const thumbnailPath = path.join(uploadDir, thumbnailFilename);

  if (!fs.existsSync(thumbnailPath)) {
    return undefined;
  }

  return buildUploadUrl(thumbnailFilename, parsed.type);
};

const mapImageFields = (image) => {
  if (!image) return image;

  const author = image.author || image.uploader;
  const authorId = image.authorId || image.uploaderId || author?.id;
  const imageUrl = image.imageUrl || image.url;
  const thumbnailUrl = image.thumbnailUrl || getExistingThumbnailUrl(imageUrl);

  return {
    ...image,
    imageUrl,
    thumbnailUrl,
    author,
    authorId
  };
};

const mapImageList = (images) => {
  if (!Array.isArray(images)) return images;
  return images.map(mapImageFields);
};

/**
 * 映射隐私图片字段
 */
const mapPrivateImageFields = (image) => {
  if (!image) return image;

  const author = image.owner;
  const authorId = image.ownerId || author?.id;
  const imageUrl = image.imageUrl || image.url;
  const thumbnailUrl = image.thumbnailUrl || getExistingThumbnailUrl(imageUrl);

  return {
    ...image,
    imageUrl,
    thumbnailUrl,
    author,
    authorId
  };
};

/**
 * 映射隐私图片列表
 */
const mapPrivateImageList = (images) => {
  if (!Array.isArray(images)) return images;
  return images.map(mapPrivateImageFields);
};

module.exports = {
  mapImageFields,
  mapImageList,
  mapPrivateImageFields,
  mapPrivateImageList
};
