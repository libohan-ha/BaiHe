图片上传功能分析

  一、整体流程

  用户选择图片 → 前端压缩(>3.5MB时) → POST /api/upload/xxx → 返 回URL
       ↓
  填写元数据(标题、描述) → POST /api/images → 保存到数据库      

  二、前端实现

  API 层 (yuri-archive/src/services/api.ts)：
  - uploadAvatar() → /api/upload/avatar
  - uploadCover() → /api/upload/cover
  - uploadGalleryImage() → /api/upload/gallery
  - uploadChatImage() → /api/upload/chat

  使用 FormData 上传，携带 JWT token 认证。大于 3.5MB 的图片会自动用 Canvas 压缩。

  三、后端实现

  路由 (test/backend/src/routes/upload.routes.js)：
  router.post('/avatar', auth, uploadAvatar.single('file'), uploadFile)
  router.post('/gallery', auth, uploadGallery.single('file'), uploadFile)
  // ...

  Multer 配置 (test/backend/src/config/multer.js)：
  - 存储路径：uploads/avatars、uploads/gallery、uploads/chat、uploads/covers
  - 文件命名：{userId}_{timestamp}_{随机8位}.{ext}
  - 限制：仅允许 jpg/png/gif/webp，最大 50MB

  服务层返回：
  { url: '/uploads/gallery/xxx.jpg', filename, size, mimetype } 

  四、数据库交互

  分离存储：文件存在磁盘，URL 存在数据库

  Schema (prisma/schema.prisma)：
  model Image {
    id       String  @id
    url      String          // 存储上传返回的 URL
    title    String
    // ...
  }

  model ChatMessage {
    images   String[]        // 图片URL数组，支持多图
    // ...
  }

  五、Docker vs 本地开发

  | 对比项     | 本地开发              | Docker 部署            
   |
  |------------|-----------------------|---------------------------|
  | 数据库连接 | localhost:5432        | host.docker.internal:5432 |
  | 上传目录   | test/backend/uploads/ | 容器内 /app/uploads       |
  | 文件持久化 | 本地文件系统          | Volume 挂载到宿主机       |

  关键配置 (docker-compose.yml)：
  volumes:
    - ./test/backend/uploads:/app/uploads

  这行配置将容器内的 /app/uploads 映射到宿主机的 test/backend/uploads，所以：
  - Docker 和本地开发共享同一个上传目录
  - 容器重启后文件不会丢失

  静态文件服务 (app.js)：
  app.use('/uploads', express.static(path.join(__dirname, '../uploads')))

  六、总结

  | 特点     | 说明                                     |       
  |----------|------------------------------------------|       
  | 存储方式 | 本地文件系统（非云存储）                 |       
  | 安全机制 | JWT 认证 + 文件类型白名单 + 文件名随机化 |       
  | 分类存储 | avatars / covers / gallery / chat        |       
  | Docker   | 通过 Volume 挂载与本地共享存储           |  