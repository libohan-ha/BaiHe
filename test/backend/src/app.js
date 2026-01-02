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

const app = express();

app.use(morgan('dev'));
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
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

app.use((req, res) => {
  res.status(404).json({
    code: 404,
    message: '资源不存在',
    data: null
  });
});

app.use(errorHandler);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 服务器运行在 http://localhost:${PORT}`);
  console.log(`📝 健康检查: http://localhost:${PORT}/api/health`);
});

module.exports = app;
