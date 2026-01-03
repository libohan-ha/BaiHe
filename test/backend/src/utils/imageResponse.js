const mapImageFields = (image) => {
  if (!image) return image;

  const author = image.author || image.uploader;
  const authorId = image.authorId || image.uploaderId || author?.id;
  const imageUrl = image.imageUrl || image.url;

  return {
    ...image,
    imageUrl,
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

  return {
    ...image,
    imageUrl,
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
