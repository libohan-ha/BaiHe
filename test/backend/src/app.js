const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const http = require('http');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();
const { corsOriginDelegate } = require('./config/cors');
const { validateSecurityConfig } = require('./config/security');
const securityHeaders = require('./middleware/securityHeaders');

validateSecurityConfig();

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
const privateImageRoutes = require('./routes/privateImage.routes');
const privateImageTagRoutes = require('./routes/privateImageTag.routes');
const privateImageCollectionRoutes = require('./routes/privateImageCollection.routes');
const publicChatRoutes = require('./routes/publicChat.routes');
const aiGroupChatRoutes = require('./routes/aiGroupChat.routes');
const { initSocket } = require('./socket');

const app = express();
const server = http.createServer(app);
const requestBodyLimit = process.env.REQUEST_BODY_LIMIT || '20mb';

const io = initSocket(server);

app.disable('x-powered-by');
app.use(morgan('dev'));
app.use(securityHeaders);
app.use(cors({
  origin: corsOriginDelegate,
  credentials: true
}));
app.use(express.json({ limit: requestBodyLimit }));
app.use(express.urlencoded({ extended: true, limit: requestBodyLimit }));
app.use(cookieParser());

const uploadsRoot = path.join(__dirname, '../uploads');
app.use('/uploads/avatars', express.static(path.join(uploadsRoot, 'avatars')));
app.use('/uploads/covers', express.static(path.join(uploadsRoot, 'covers')));
app.use('/uploads/gallery', express.static(path.join(uploadsRoot, 'gallery')));
app.use('/uploads/chat', express.static(path.join(uploadsRoot, 'chat')));

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
app.use('/api/private-images', privateImageRoutes);
app.use('/api/private-image-tags', privateImageTagRoutes);
app.use('/api/private-image-collections', privateImageCollectionRoutes);
app.use('/api/public-chat', publicChatRoutes);
app.use('/api/ai-group-chat', aiGroupChatRoutes);

app.use((req, res) => {
  res.status(404).json({
    code: 404,
    message: 'Resource not found',
    data: null
  });
});

app.use(errorHandler);

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

server.listen(PORT, HOST, () => {
  console.log(`[server] listening on http://${HOST}:${PORT}`);
  console.log(`[health] http://localhost:${PORT}/api/health`);
});

module.exports = { app, server, io };
