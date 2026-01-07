const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

const errorHandler = require('./middleware/errorHandler');
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const articleRoutes = require('./routes/article.routes');
const tagRoutes = require('./routes/tag.routes');
const collectionRoutes = require('./routes/collection.routes');
const commentRoutes = require('./routes/comment.routes');
const adminRoutes = require('./routes/admin.routes');
const uploadRoutes = require('./routes/upload.routes');
const imageRoutes = require('./routes/image.routes');
const imageTagRoutes = require('./routes/imageTag.routes');
const imageCollectionRoutes = require('./routes/imageCollection.routes');
const aiChatRoutes = require('./routes/aiChat.routes');
// 隐私相册相关路由
const privateImageRoutes = require('./routes/privateImage.routes');
const privateImageTagRoutes = require('./routes/privateImageTag.routes');
const privateImageCollectionRoutes = require('./routes/privateImageCollection.routes');

const app = express();

app.use(morgan('dev'));
app.use(cors({
  origin: process.env.CORS_ORIGIN || true,  // 允许所有来源（开发环境）
  credentials: true
}));
app.use(express.json({ limit: '500mb' }));  // 增加请求体大小限制，支持图片 base64
app.use(express.urlencoded({ extended: true, limit: '500mb' }));
app.use(cookieParser());

// 静态文件服务 - 用于访问上传的文件
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/articles', articleRoutes);
app.use('/api/tags', tagRoutes);
app.use('/api/collections', collectionRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/images', imageRoutes);
app.use('/api/image-tags', imageTagRoutes);
app.use('/api/image-collections', imageCollectionRoutes);
app.use('/api/ai-chat', aiChatRoutes);
// 隐私相册相关路由
app.use('/api/private-images', privateImageRoutes);
app.use('/api/private-image-tags', privateImageTagRoutes);
app.use('/api/private-image-collections', privateImageCollectionRoutes);

app.use((req, res) => {
  res.status(404).json({
    code: 404,
    message: '资源不存在',
    data: null
  });
});

app.use(errorHandler);

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';  // 监听所有网络接口

app.listen(PORT, HOST, () => {
  console.log(`🚀 服务器运行在 http://${HOST}:${PORT}`);
  console.log(`📝 健康检查: http://localhost:${PORT}/api/health`);
  console.log(`🌐 局域网访问: http://<你的IP>:${PORT}`);
});

module.exports = app;
