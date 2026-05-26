const path = require('path');
const fs = require('fs/promises');
const sharp = require('sharp');
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { UPLOAD_DIRS } = require('../src/config/multer');
const {
  parseUploadUrl,
  getThumbnailFilename,
  buildUploadUrl
} = require('../src/services/upload.service');

const prisma = new PrismaClient();
const THUMBNAIL_WIDTH = 480;
const THUMBNAIL_QUALITY = 72;

const stats = {
  scanned: 0,
  generated: 0,
  reused: 0,
  updated: 0,
  skipped: 0,
  failed: 0
};

const fileExists = async (filePath) => {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
};

const createThumbnail = async (sourcePath, targetPath) => {
  await sharp(sourcePath, { animated: false })
    .rotate()
    .resize({ width: THUMBNAIL_WIDTH, withoutEnlargement: true })
    .webp({ quality: THUMBNAIL_QUALITY })
    .toFile(targetPath);
};

const ensureThumbnailForUrl = async (url, fallbackType) => {
  const parsed = parseUploadUrl(url);
  if (!parsed) return null;

  const type = parsed.type || fallbackType;
  if (!['gallery', 'private', 'cover', 'chat'].includes(type)) return null;
  if (parsed.filename.endsWith('_thumb.webp')) return null;

  const uploadDir = UPLOAD_DIRS[type];
  if (!uploadDir) return null;

  const sourcePath = path.join(uploadDir, path.basename(parsed.filename));
  const thumbnailFilename = getThumbnailFilename(parsed.filename);
  const thumbnailPath = path.join(uploadDir, thumbnailFilename);

  if (!(await fileExists(sourcePath))) {
    return null;
  }

  if (await fileExists(thumbnailPath)) {
    stats.reused += 1;
  } else {
    await createThumbnail(sourcePath, thumbnailPath);
    stats.generated += 1;
  }

  return buildUploadUrl(thumbnailFilename, type);
};

const backfillModel = async ({ model, name, fallbackType }) => {
  const records = await model.findMany({
    select: { id: true, url: true, thumbnailUrl: true }
  });

  for (const record of records) {
    stats.scanned += 1;
    try {
      const thumbnailUrl = await ensureThumbnailForUrl(record.url, fallbackType);

      if (!thumbnailUrl) {
        stats.skipped += 1;
        continue;
      }

      if (record.thumbnailUrl !== thumbnailUrl) {
        await model.update({
          where: { id: record.id },
          data: { thumbnailUrl }
        });
        stats.updated += 1;
      }
    } catch (error) {
      stats.failed += 1;
      console.warn(`[thumbnails] ${name} ${record.id} failed: ${error.message}`);
    }
  }
};

const main = async () => {
  await backfillModel({
    model: prisma.image,
    name: 'Image',
    fallbackType: 'gallery'
  });

  await backfillModel({
    model: prisma.privateImage,
    name: 'PrivateImage',
    fallbackType: 'private'
  });

  console.log(`[thumbnails] done ${JSON.stringify(stats)}`);
};

main()
  .catch((error) => {
    console.error('[thumbnails] fatal:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
