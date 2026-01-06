const multer = require('multer');
const path = require('path');
const fs = require('fs');

// 确保上传目录存在
const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

// 上传目录配置
const UPLOAD_DIRS = {
  avatar: path.join(__dirname, '../../uploads/avatars'),
  cover: path.join(__dirname, '../../uploads/covers'),
  gallery: path.join(__dirname, '../../uploads/gallery'),
  chat: path.join(__dirname, '../../uploads/chat')
};

// 确保所有上传目录存在
Object.values(UPLOAD_DIRS).forEach(ensureDir);

// 允许的文件类型
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

// 最大文件大小 (50MB) - 不限制太多，让前端压缩处理
const MAX_FILE_SIZE = 50 * 1024 * 1024;

// 生成随机字符串
const generateRandomString = (length = 8) => {
  return Math.random().toString(36).substring(2, 2 + length);
};

// 文件过滤器
const fileFilter = (req, file, cb) => {
  if (ALLOWED_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('不支持的文件类型，仅支持 jpg, jpeg, png, gif, webp'), false);
  }
};

// 创建存储配置的工厂函数
const createStorage = (type) => {
  return multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadDir = UPLOAD_DIRS[type] || UPLOAD_DIRS.avatar;
      ensureDir(uploadDir);
      // 将类型保存到 req 中，供后续使用
      req.uploadType = type;
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const userId = req.user?.id || 'anonymous';
      const timestamp = Date.now();
      const randomStr = generateRandomString();
      const ext = path.extname(file.originalname).toLowerCase();
      const filename = `${userId}_${timestamp}_${randomStr}${ext}`;
      cb(null, filename);
    }
  });
};

// 创建不同类型的 multer 实例
const uploadAvatar = multer({
  storage: createStorage('avatar'),
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE }
});

const uploadCover = multer({
  storage: createStorage('cover'),
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE }
});

const uploadGallery = multer({
  storage: createStorage('gallery'),
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE }
});

// 聊天图片上传 (50MB 限制)
const uploadChat = multer({
  storage: createStorage('chat'),
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 }
});

// 通用上传（默认为 avatar）
const upload = multer({
  storage: createStorage('avatar'),
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE }
});

module.exports = {
  upload,
  uploadAvatar,
  uploadCover,
  uploadGallery,
  uploadChat,
  UPLOAD_DIRS,
  ALLOWED_TYPES,
  MAX_FILE_SIZE
};