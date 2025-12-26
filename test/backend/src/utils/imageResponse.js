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

module.exports = {
  mapImageFields,
  mapImageList
};
