# 百合文学档案馆 (Yuri Archive) - 项目架构分析报告

## 项目概览

- **项目名称**: 百合文学档案馆 (Yuri Archive)
- **项目类型**: 全栈Web应用（前后端分离）
- **技术栈**: 
  - **前端**: React 19 + TypeScript + Vite + Ant Design 6 + Zustand + React Router 7
  - **后端**: Node.js + Express 5 + Prisma ORM + PostgreSQL
  - **认证**: JWT (JSON Web Token)
  - **文件存储**: 本地文件系统 (支持扩展至阿里云OSS)
- **入口文件**: 
  - 后端: [`test/backend/src/app.js`](test/backend/src/app.js:1)
  - 前端: [`yuri-archive/src/main.tsx`](yuri-archive/src/main.tsx:1)

---

## 功能模块总览

| 模块编号 | 模块名称 | 一句话描述 |
|---------|---------|-----------|
| M1 | 用户认证模块 | 处理用户注册、登录、JWT令牌管理和权限控制 |
| M2 | 文章管理模块 | 提供文章的CRUD操作、Markdown内容管理和标签关联 |
| M3 | 图片画廊模块 | 支持图片上传、浏览、标签分类和收藏功能 |
| M4 | 标签系统模块 | 统一管理文章标签和图片标签，支持按标签筛选 |
| M5 | 收藏系统模块 | 用户对文章和图片的收藏管理功能 |
| M6 | 评论系统模块 | 支持文章和图片的嵌套评论功能 |
| M7 | 管理后台模块 | 管理员对用户、内容的管理和审核功能 |
| M8 | 文件上传模块 | 处理头像、封面、画廊图片的上传和存储 |
| M9 | 前端布局模块 | 响应式布局、导航、侧边栏和页面框架 |
| M10 | 状态管理模块 | 使用Zustand管理用户登录状态和全局状态 |

---

## 模块依赖关系图

```
┌─────────────────────────────────────────────────────────────────┐
│                        前端应用 (yuri-archive)                    │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐         │
│  │ M9 布局模块  │───▶│ 页面组件     │◀───│M10 状态管理  │         │
│  └─────────────┘    └──────┬──────┘    └─────────────┘         │
│                            │                                    │
│                            ▼                                    │
│                   ┌─────────────────┐                          │
│                   │  API服务层       │                          │
│                   │ (services/api)  │                          │
│                   └────────┬────────┘                          │
└────────────────────────────┼────────────────────────────────────┘
                             │ HTTP/REST
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                        后端API (test/backend)                    │
├─────────────────────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────────────────────┐ │
│  │                    Express 路由层                          │ │
│  │  /api/auth  /api/articles  /api/images  /api/admin  ...  │ │
│  └─────────────────────────┬─────────────────────────────────┘ │
│                            │                                    │
│  ┌─────────────┐          │          ┌─────────────┐          │
│  │ M1 认证中间件 │◀─────────┼─────────▶│ M8 上传中间件 │          │
│  └─────────────┘          │          └─────────────┘          │
│                            ▼                                    │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │                    控制器层 (Controllers)                   │ │
│  └─────────────────────────┬─────────────────────────────────┘ │
│                            │                                    │
│                            ▼                                    │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │                    服务层 (Services)                        │ │
│  │  M2文章  M3图片  M4标签  M5收藏  M6评论  M7管理           │ │
│  └─────────────────────────┬─────────────────────────────────┘ │
│                            │                                    │
│                            ▼                                    │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │              Prisma ORM + PostgreSQL                       │ │
│  └───────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

# 模块详解

## M1: 用户认证模块

### 功能说明

该模块负责整个应用的用户身份验证和授权管理。主要解决以下问题：
- 用户注册与账号创建
- 用户登录与JWT令牌生成
- 用户身份验证（普通用户、管理员、超级管理员）
- 用户资料的获取和更新
- 密码修改功能

在整体架构中，该模块是所有需要身份验证功能的基础依赖。

### 逻辑实现

**核心业务流程**:

```
注册流程: 用户提交 → 校验邮箱/用户名唯一性 → 密码bcrypt加密 → 创建用户 → 生成JWT → 返回用户信息+令牌

登录流程: 用户提交 → 查找用户 → bcrypt密码比对 → 生成JWT → 返回用户信息+令牌

认证流程: 请求携带Bearer Token → 中间件验证JWT → 查询用户信息 → 挂载到req.user → 放行请求
```

**权限层级设计**:
- `USER`: 普通用户，可进行基本的内容浏览和创作
- `ADMIN`: 管理员，可管理用户和内容
- `SUPER_ADMIN`: 超级管理员，可管理其他管理员

### 代码实现

- 核心文件:
  - [`test/backend/src/services/auth.service.js`](test/backend/src/services/auth.service.js:1) - 认证业务逻辑
  - [`test/backend/src/middleware/auth.middleware.js`](test/backend/src/middleware/auth.middleware.js:1) - JWT验证中间件
  - [`test/backend/src/controllers/auth.controller.js`](test/backend/src/controllers/auth.controller.js:1) - 认证控制器
  - [`test/backend/src/routes/auth.routes.js`](test/backend/src/routes/auth.routes.js:1) - 认证路由

- 关键函数:
  - [`register()`](test/backend/src/services/auth.service.js:11) - 用户注册，包含邮箱/用户名唯一性校验和密码加密
  - [`login()`](test/backend/src/services/auth.service.js:53) - 用户登录，验证密码并生成JWT
  - [`auth()`](test/backend/src/middleware/auth.middleware.js:4) - JWT验证中间件，解析Bearer令牌
  - [`optionalAuth()`](test/backend/src/middleware/auth.middleware.js:67) - 可选认证中间件，用于公开但需识别用户的接口

- 关键代码片段:

```javascript
// JWT验证中间件核心逻辑 (auth.middleware.js:4-65)
const auth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        code: 401,
        message: '未授权，请先登录',
        data: null
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, username: true, role: true, avatarUrl: true }
    });

    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    // 处理Token过期或无效的情况
  }
};
```

---

## M2: 文章管理模块

### 功能说明

该模块提供完整的文章内容管理功能，是整个平台的核心内容模块之一：
- 文章列表获取（支持分页、标签筛选、关键词搜索、排序）
- 文章详情获取（自动增加浏览次数）
- 文章创建（支持Markdown内容、封面图、标签关联）
- 文章更新和删除（权限控制：作者或管理员）
- 相关文章推荐（基于标签相似度）

### 逻辑实现

**数据模型设计**:

```prisma
model Article {
  id          String        @id @default(cuid())
  title       String                    // 文章标题
  summary     String?                   // 文章摘要
  content     String                    // Markdown正文内容
  coverUrl    String?                   // 封面图片URL
  authorId    String                    // 作者ID (外键)
  author      User          @relation   // 关联用户
  views       Int           @default(0) // 浏览次数
  status      ArticleStatus @default(PUBLISHED) // 状态：草稿/已发布
  tags        Tag[]                     // 多对多关联标签
  collections Collection[]              // 被收藏记录
  comments    Comment[]                 // 评论
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt
}
```

**标签处理逻辑**:

模块实现了智能的标签输入标准化处理，支持多种输入格式：
- 字符串（逗号分隔）: `"标签1,标签2,标签3"`
- 对象数组: `[{name: "标签1"}, {id: "xxx", label: "标签2"}]`
- 混合数组: `["标签1", "cmjjxold80000f2pc0fl8wt61"]`（自动识别CUID格式的ID）

### 代码实现

- 核心文件:
  - [`test/backend/src/services/article.service.js`](test/backend/src/services/article.service.js:1) - 文章业务逻辑
  - [`test/backend/src/controllers/article.controller.js`](test/backend/src/controllers/article.controller.js:1) - 文章控制器
  - [`test/backend/src/routes/article.routes.js`](test/backend/src/routes/article.routes.js:1) - 文章路由

- 关键函数:
  - [`getArticles()`](test/backend/src/services/article.service.js:109) - 获取文章列表，支持多维度筛选和分页
  - [`getArticleById()`](test/backend/src/services/article.service.js:200) - 获取文章详情并增加浏览次数
  - [`createArticle()`](test/backend/src/services/article.service.js:251) - 创建文章，处理标签关联
  - [`updateArticle()`](test/backend/src/services/article.service.js:283) - 更新文章，包含权限校验
  - [`normalizeTagsInput()`](test/backend/src/services/article.service.js:11) - 标签输入标准化处理
  - [`getRelatedArticles()`](test/backend/src/services/article.service.js:356) - 基于标签的相关文章推荐

- 关键代码片段:

```javascript
// 文章列表查询核心逻辑 (article.service.js:109-197)
const getArticles = async (filters) => {
  const page = normalizePageNumber(filters?.page, 1);
  const pageSize = normalizePageNumber(filters?.pageSize, 10);
  const tag = normalizeQueryValue(filters?.tag);
  const search = normalizeQueryValue(filters?.search);

  const where = { status: 'PUBLISHED' };

  // 标签筛选：支持ID或名称
  if (tag) {
    where.tags = {
      some: { ...(isCuid(tag) ? { id: tag } : { name: tag }) }
    };
  }

  // 全文搜索：标题、摘要、内容
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { summary: { contains: search, mode: 'insensitive' } },
      { content: { contains: search, mode: 'insensitive' } }
    ];
  }

  const [articles, total] = await Promise.all([
    prisma.article.findMany({
      where, skip: (page - 1) * pageSize, take: pageSize,
      orderBy, include: { author: {...}, tags: {...}, _count: {...} }
    }),
    prisma.article.count({ where })
  ]);

  return { articles, pagination: { page, pageSize, total, totalPages } };
};
```

---

## M3: 图片画廊模块

### 功能说明

图片画廊是平台的另一核心功能，提供百合插画的展示和管理：
- 图片列表浏览（瀑布流展示、分页、标签筛选、搜索）
- 图片详情查看（自动增加浏览次数）
- 图片上传（标题、描述、标签、文件上传）
- 图片编辑和删除（权限控制）
- 用户上传的图片管理

### 逻辑实现

**数据模型设计**:

```prisma
model Image {
  id           String            @id @default(cuid())
  title        String                      // 图片标题
  description  String?                     // 图片描述
  url          String                      // 原图URL
  thumbnailUrl String?                     // 缩略图URL
  width        Int?                        // 图片宽度
  height       Int?                        // 图片高度
  size         Int               @default(0) // 文件大小(字节)
  uploaderId   String                      // 上传者ID
  uploader     User              @relation // 关联用户
  tags         ImageTag[]                  // 图片标签（独立于文章标签）
  collections  ImageCollection[]           // 被收藏记录
  comments     Comment[]                   // 评论
  views        Int               @default(0) // 浏览次数
  createdAt    DateTime          @default(now())
  updatedAt    DateTime          @updatedAt
}
```

**与文章模块的设计差异**:
- 使用独立的 `ImageTag` 模型（而非复用 `Tag`），便于两类内容独立管理
- 增加图片特有属性：width、height、size、thumbnailUrl
- 使用 `uploader` 而非 `author` 命名，语义更清晰

### 代码实现

- 核心文件:
  - [`test/backend/src/services/image.service.js`](test/backend/src/services/image.service.js:1) - 图片业务逻辑
  - [`test/backend/src/controllers/image.controller.js`](test/backend/src/controllers/image.controller.js:1) - 图片控制器
  - [`test/backend/src/routes/image.routes.js`](test/backend/src/routes/image.routes.js:1) - 图片路由

- 关键函数:
  - [`getImages()`](test/backend/src/services/image.service.js:107) - 获取图片列表
  - [`getImageById()`](test/backend/src/services/image.service.js:191) - 获取图片详情
  - [`createImage()`](test/backend/src/services/image.service.js:237) - 创建图片记录
  - [`updateImage()`](test/backend/src/services/image.service.js:274) - 更新图片信息
  - [`deleteImage()`](test/backend/src/services/image.service.js:328) - 删除图片（返回URL用于清理文件）
  - [`getUserImages()`](test/backend/src/services/image.service.js:351) - 获取用户上传的图片

- 关键代码片段:

```javascript
// 图片创建核心逻辑 (image.service.js:237-269)
const createImage = async (data, uploaderId) => {
  const { title, description, url, thumbnailUrl, width, height, size } = data;
  const tagsRelation = buildTagsRelation(data); // 复用标签处理逻辑

  const image = await prisma.image.create({
    data: {
      title,
      description,
      url,
      thumbnailUrl,
      width,
      height,
      size,
      uploaderId,
      tags: tagsRelation ? {
        ...(tagsRelation.connect ? { connect: tagsRelation.connect } : {}),
        ...(tagsRelation.connectOrCreate ? { connectOrCreate: tagsRelation.connectOrCreate } : {})
      } : undefined
    },
    include: { uploader: {...}, tags: true }
  });

  return image;
};
```

---

## M4: 标签系统模块

### 功能说明

标签系统为内容分类和发现提供支持：
- 文章标签管理（Tag模型）
- 图片标签管理（ImageTag模型）
- 热门标签获取（按关联内容数量排序）
- 标签的增删改（管理员权限）
- 按标签筛选内容

### 逻辑实现

**双标签体系设计**:

```prisma
// 文章标签
model Tag {
  id        String    @id @default(cuid())
  name      String    @unique  // 标签名称唯一
  articles  Article[]          // 多对多关联文章
  createdAt DateTime  @default(now())
}

// 图片标签（独立管理）
model ImageTag {
  id        String   @id @default(cuid())
  name      String   @unique
  images    Image[]
  createdAt DateTime @default(now())
}
```

**设计决策说明**:
选择分离两套标签体系的原因：
1. 文章和图片的标签命名习惯可能不同（如"百合小说" vs "百合插画"）
2. 便于各自的热门标签统计
3. 管理员可以独立管理两类标签

### 代码实现

- 核心文件:
  - [`test/backend/src/services/tag.service.js`](test/backend/src/services/tag.service.js:1) - 文章标签服务
  - [`test/backend/src/services/imageTag.service.js`](test/backend/src/services/imageTag.service.js:1) - 图片标签服务
  - [`test/backend/src/routes/tag.routes.js`](test/backend/src/routes/tag.routes.js:1) - 文章标签路由
  - [`test/backend/src/routes/imageTag.routes.js`](test/backend/src/routes/imageTag.routes.js:1) - 图片标签路由

- 前端标签云组件:
  - [`yuri-archive/src/components/TagCloud/index.tsx`](yuri-archive/src/components/TagCloud/index.tsx:1) - 文章标签云
  - [`yuri-archive/src/components/ImageTagCloud/index.tsx`](yuri-archive/src/components/ImageTagCloud/index.tsx:1) - 图片标签云

---

## M5: 收藏系统模块

### 功能说明

用户收藏功能，支持文章和图片两类内容的收藏：
- 添加/取消收藏
- 获取用户的收藏列表（分页）
- 检查是否已收藏

### 逻辑实现

**数据模型**:

```prisma
// 文章收藏
model Collection {
  id        String   @id @default(cuid())
  userId    String
  articleId String
  user      User     @relation
  article   Article  @relation
  createdAt DateTime @default(now())
  
  @@unique([userId, articleId])  // 确保用户对同一文章只能收藏一次
}

// 图片收藏
model ImageCollection {
  id        String   @id @default(cuid())
  userId    String
  imageId   String
  user      User     @relation
  image     Image    @relation
  createdAt DateTime @default(now())
  
  @@unique([userId, imageId])
}
```

### 代码实现

- 核心文件:
  - [`test/backend/src/services/collection.service.js`](test/backend/src/services/collection.service.js:1) - 文章收藏服务
  - [`test/backend/src/services/imageCollection.service.js`](test/backend/src/services/imageCollection.service.js:1) - 图片收藏服务
  - [`test/backend/src/routes/collection.routes.js`](test/backend/src/routes/collection.routes.js:1) - 文章收藏路由
  - [`test/backend/src/routes/imageCollection.routes.js`](test/backend/src/routes/imageCollection.routes.js:1) - 图片收藏路由

---

## M6: 评论系统模块

### 功能说明

统一的评论系统，支持对文章和图片的评论：
- 发表评论（需登录）
- 回复评论（嵌套评论）
- 删除评论（作者或管理员）
- 获取评论列表（树形结构）

### 逻辑实现

**数据模型（统一评论表）**:

```prisma
model Comment {
  id        String   @id @default(cuid())
  content   String                    // 评论内容
  articleId String?                   // 关联文章ID（可选）
  imageId   String?                   // 关联图片ID（可选）
  userId    String                    // 评论者ID
  parentId  String?                   // 父评论ID（用于嵌套回复）
  article   Article? @relation
  image     Image?   @relation
  user      User     @relation
  parent    Comment? @relation("CommentReplies")
  replies   Comment[] @relation("CommentReplies")  // 自关联，获取子回复
  createdAt DateTime @default(now())
}
```

**设计亮点**:
- 使用单表设计支持多类型内容评论（articleId 或 imageId 二选一）
- 自关联实现嵌套回复
- 删除时级联删除所有子回复

### 代码实现

- 核心文件:
  - [`test/backend/src/services/comment.service.js`](test/backend/src/services/comment.service.js:1) - 评论服务
  - [`test/backend/src/controllers/comment.controller.js`](test/backend/src/controllers/comment.controller.js:1) - 评论控制器
  - [`test/backend/src/routes/comment.routes.js`](test/backend/src/routes/comment.routes.js:1) - 评论路由
  - [`yuri-archive/src/components/CommentSection/index.tsx`](yuri-archive/src/components/CommentSection/index.tsx:1) - 前端评论组件

---

## M7: 管理后台模块

### 功能说明

管理员和超级管理员的后台管理功能：
- 用户管理：查看用户列表、修改角色、删除用户
- 文章管理：查看所有文章、修改状态、删除文章
- 图片管理：查看所有图片、删除图片
- 管理员管理（超级管理员专属）：创建/修改/删除管理员账号

### 逻辑实现

**权限层级**:

```
SUPER_ADMIN (超级管理员)
    ↓ 可管理
ADMIN (管理员)
    ↓ 可管理
USER (普通用户)
```

**权限控制中间件链**:

```javascript
// admin.middleware.js - 组合中间件
const adminAuth = [auth, admin];  // 先验证登录，再验证管理员权限
```

### 代码实现

- 核心文件:
  - [`test/backend/src/services/admin.service.js`](test/backend/src/services/admin.service.js:1) - 超级管理员服务
  - [`test/backend/src/services/adminPanel.service.js`](test/backend/src/services/adminPanel.service.js:1) - 管理面板服务
  - [`test/backend/src/controllers/admin.controller.js`](test/backend/src/controllers/admin.controller.js:1) - 管理员控制器
  - [`test/backend/src/routes/admin.routes.js`](test/backend/src/routes/admin.routes.js:1) - 管理路由
  - [`yuri-archive/src/pages/AdminPage/index.tsx`](yuri-archive/src/pages/AdminPage/index.tsx:1) - 前端管理页面

---

## M8: 文件上传模块

### 功能说明

处理各类文件上传：
- 用户头像上传
- 文章封面上传
- 画廊图片上传
- 文件类型验证和大小限制
- 文件存储路径管理

### 逻辑实现

**Multer配置**:

```javascript
// 文件存储路径配置
uploads/
├── avatars/       // 用户头像
├── covers/        // 文章封面
└── gallery/       // 画廊图片
```

**文件命名策略**: `{userId}_{timestamp}_{randomString}.{extension}`

### 代码实现

- 核心文件:
  - [`test/backend/src/config/multer.js`](test/backend/src/config/multer.js:1) - Multer配置
  - [`test/backend/src/services/upload.service.js`](test/backend/src/services/upload.service.js:1) - 上传服务
  - [`test/backend/src/controllers/upload.controller.js`](test/backend/src/controllers/upload.controller.js:1) - 上传控制器
  - [`test/backend/src/routes/upload.routes.js`](test/backend/src/routes/upload.routes.js:1) - 上传路由

---

## M9: 前端布局模块

### 功能说明

前端应用的整体布局框架：
- 响应式Header（导航、搜索、用户菜单）
- 可折叠Sidebar（导航菜单）
- 主内容区域
- Footer
- 移动端适配（断点：768px）

### 逻辑实现

**布局结构**:

```
┌─────────────────────────────────────┐
│              Header                  │
├──────────┬──────────────────────────┤
│          │                          │
│ Sidebar  │      Content Area        │
│          │      (Outlet)            │
│          │                          │
├──────────┴──────────────────────────┤
│              Footer                  │
└─────────────────────────────────────┘
```

**响应式策略**:
- 桌面端：Sidebar默认展开
- 移动端：Sidebar默认收起，可通过Header按钮切换

### 代码实现

- 核心文件:
  - [`yuri-archive/src/components/Layout/index.tsx`](yuri-archive/src/components/Layout/index.tsx:1) - 主布局组件
  - [`yuri-archive/src/components/Layout/Header.tsx`](yuri-archive/src/components/Layout/Header.tsx:1) - 顶部导航
  - [`yuri-archive/src/components/Layout/Footer.tsx`](yuri-archive/src/components/Layout/Footer.tsx:1) - 页脚
  - [`yuri-archive/src/components/Sidebar/index.tsx`](yuri-archive/src/components/Sidebar/index.tsx:1) - 侧边栏

- 关键代码片段:

```tsx
// 响应式布局核心逻辑 (Layout/index.tsx:14-45)
export function Layout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    return typeof window !== 'undefined' && window.innerWidth < MOBILE_BREAKPOINT
  })
  const [isMobile, setIsMobile] = useState(...)

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < MOBILE_BREAKPOINT
      setIsMobile(mobile)
      
      // 响应式自动调整侧边栏状态
      if (wasMobile && !mobile) setSidebarCollapsed(false)
      if (!wasMobile && mobile) setSidebarCollapsed(true)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [isMobile])

  return (
    <AntLayout>
      <Header onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)} />
      <AntLayout>
        <Sidebar collapsed={sidebarCollapsed} />
        <Content><Outlet /></Content>
      </AntLayout>
      <Footer />
    </AntLayout>
  )
}
```

---

## M10: 状态管理模块

### 功能说明

使用Zustand进行全局状态管理：
- 用户登录状态
- 当前用户信息
- JWT Token存储
- 登录/登出操作

### 逻辑实现

**状态结构**:

```typescript
interface UserStore {
  currentUser: User | null      // 当前登录用户
  token: string | null          // JWT令牌
  isLoggedIn: boolean           // 登录状态
  setUser: (user, token?) => void  // 设置用户（登录/更新资料）
  logout: () => void            // 登出
}
```

**持久化策略**:
- 使用 `zustand/middleware/persist` 将状态持久化到 localStorage
- key: `yuri-archive-user`
- Token同时存储在localStorage中供API请求使用

### 代码实现

- 核心文件:
  - [`yuri-archive/src/store/userStore.ts`](yuri-archive/src/store/userStore.ts:1) - 用户状态Store

- 关键代码片段:

```typescript
// Zustand状态定义 (userStore.ts:13-53)
export const useUserStore = create<UserStore>()(
  persist(
    (set, get) => ({
      currentUser: null,
      token: null,
      isLoggedIn: false,
      
      setUser: (user: User, token?: string) => {
        if (token) {
          localStorage.setItem('token', token)
          set({ currentUser: user, token, isLoggedIn: true })
        } else {
          // 只更新用户信息，保留原有token
          set({ currentUser: user })
        }
      },
      
      logout: () => {
        localStorage.removeItem('token')
        set({ currentUser: null, token: null, isLoggedIn: false })
      },
    }),
    {
      name: 'yuri-archive-user',
      partialize: (state) => ({
        currentUser: state.currentUser,
        token: state.token,
        isLoggedIn: state.isLoggedIn,
      }),
    }
  )
)
```

---

## 前端页面组件总览

| 页面 | 路由 | 描述 | 核心文件 |
|-----|------|------|---------|
| 首页 | `/` | 文章列表、热门标签 | [`HomePage/index.tsx`](yuri-archive/src/pages/HomePage/index.tsx:1) |
| 文章详情 | `/article/:id` | Markdown渲染、评论 | [`ArticleDetailPage/index.tsx`](yuri-archive/src/pages/ArticleDetailPage/index.tsx:1) |
| 搜索页 | `/search` | 文章搜索结果 | [`SearchPage/index.tsx`](yuri-archive/src/pages/SearchPage/index.tsx:1) |
| 标签页 | `/tag/:id` | 按标签筛选文章 | [`TagPage/index.tsx`](yuri-archive/src/pages/TagPage/index.tsx:1) |
| 个人中心 | `/user` | 我的投稿、收藏 | [`UserCenterPage/index.tsx`](yuri-archive/src/pages/UserCenterPage/index.tsx:1) |
| 用户主页 | `/user/:id` | 查看他人主页 | [`UserProfilePage/index.tsx`](yuri-archive/src/pages/UserProfilePage/index.tsx:1) |
| 登录 | `/login` | 用户登录 | [`LoginPage/index.tsx`](yuri-archive/src/pages/LoginPage/index.tsx:1) |
| 注册 | `/register` | 用户注册 | [`RegisterPage/index.tsx`](yuri-archive/src/pages/RegisterPage/index.tsx:1) |
| 创建文章 | `/create` | 发布新文章 | [`CreateArticlePage/index.tsx`](yuri-archive/src/pages/CreateArticlePage/index.tsx:1) |
| 编辑文章 | `/edit/:id` | 编辑已有文章 | [`EditArticlePage/index.tsx`](yuri-archive/src/pages/EditArticlePage/index.tsx:1) |
| 管理后台 | `/admin` | 管理员功能 | [`AdminPage/index.tsx`](yuri-archive/src/pages/AdminPage/index.tsx:1) |
| 图片画廊 | `/gallery` | 图片列表浏览 | [`GalleryPage/index.tsx`](yuri-archive/src/pages/GalleryPage/index.tsx:1) |
| 图片详情 | `/image/:id` | 图片查看、评论 | [`ImageDetailPage/index.tsx`](yuri-archive/src/pages/ImageDetailPage/index.tsx:1) |
| 上传图片 | `/upload-image` | 上传新图片 | [`UploadImagePage/index.tsx`](yuri-archive/src/pages/UploadImagePage/index.tsx:1) |
| 编辑图片 | `/edit-image/:id` | 编辑图片信息 | [`EditImagePage/index.tsx`](yuri-archive/src/pages/EditImagePage/index.tsx:1) |

---

## API接口总览

| 模块 | 路径前缀 | 主要功能 |
|-----|---------|---------|
| 认证 | `/api/auth` | 注册、登录、资料管理 |
| 用户 | `/api/users` | 用户信息、用户文章/图片 |
| 文章 | `/api/articles` | 文章CRUD、相关文章 |
| 标签 | `/api/tags` | 文章标签管理 |
| 收藏 | `/api/collections` | 文章收藏 |
| 评论 | `/api/comments` | 评论CRUD |
| 管理 | `/api/admin` | 管理员功能 |
| 上传 | `/api/upload` | 文件上传 |
| 图片 | `/api/images` | 图片CRUD |
| 图片标签 | `/api/image-tags` | 图片标签管理 |
| 图片收藏 | `/api/image-collections` | 图片收藏 |

---

## 建议阅读顺序

为了系统性地理解整个项目，建议按以下顺序阅读源码：

### 第一阶段：项目基础（Day 1）
1. **数据模型** - [`test/backend/prisma/schema.prisma`](test/backend/prisma/schema.prisma:1)
   - 理解所有数据表的结构和关联关系
   
2. **后端入口** - [`test/backend/src/app.js`](test/backend/src/app.js:1)
   - 了解Express应用的整体配置和路由注册

3. **前端入口** - [`yuri-archive/src/App.tsx`](yuri-archive/src/App.tsx:1)
   - 了解React Router配置和页面结构

### 第二阶段：认证系统（Day 2）
4. **认证服务** - [`test/backend/src/services/auth.service.js`](test/backend/src/services/auth.service.js:1)
5. **认证中间件** - [`test/backend/src/middleware/auth.middleware.js`](test/backend/src/middleware/auth.middleware.js:1)
6. **前端状态管理** - [`yuri-archive/src/store/userStore.ts`](yuri-archive/src/store/userStore.ts:1)
7. **前端API封装** - [`yuri-archive/src/services/api.ts`](yuri-archive/src/services/api.ts:1) (认证相关部分)

### 第三阶段：核心功能-文章（Day 3）
8. **文章服务** - [`test/backend/src/services/article.service.js`](test/backend/src/services/article.service.js:1)
9. **文章控制器** - [`test/backend/src/controllers/article.controller.js`](test/backend/src/controllers/article.controller.js:1)
10. **首页组件** - [`yuri-archive/src/pages/HomePage/index.tsx`](yuri-archive/src/pages/HomePage/index.tsx:1)
11. **文章列表组件** - [`yuri-archive/src/components/ArticleList/index.tsx`](yuri-archive/src/components/ArticleList/index.tsx:1)

### 第四阶段：核心功能-图片（Day 4）
12. **图片服务** - [`test/backend/src/services/image.service.js`](test/backend/src/services/image.service.js:1)
13. **上传服务** - [`test/backend/src/services/upload.service.js`](test/backend/src/services/upload.service.js:1)
14. **画廊页面** - [`yuri-archive/src/pages/GalleryPage/index.tsx`](yuri-archive/src/pages/GalleryPage/index.tsx:1)

### 第五阶段：辅助功能（Day 5）
15. **评论服务** - [`test/backend/src/services/comment.service.js`](test/backend/src/services/comment.service.js:1)
16. **收藏服务** - [`test/backend/src/services/collection.service.js`](test/backend/src/services/collection.service.js:1)
17. **管理员服务** - [`test/backend/src/services/admin.service.js`](test/backend/src/services/admin.service.js:1)

### 第六阶段：前端布局与组件（Day 6）
18. **布局组件** - [`yuri-archive/src/components/Layout/index.tsx`](yuri-archive/src/components/Layout/index.tsx:1)
19. **类型定义** - [`yuri-archive/src/types/index.ts`](yuri-archive/src/types/index.ts:1)
20. **完整API服务** - [`yuri-archive/src/services/api.ts`](yuri-archive/src/services/api.ts:1)

---

## 总结

百合文学档案馆是一个功能完整的全栈Web应用，采用现代化的技术栈和清晰的分层架构：

**后端架构特点**:
- 经典的三层架构：Routes → Controllers → Services
- Prisma ORM提供类型安全的数据库操作
- JWT实现无状态认证
- 中间件实现权限控制

**前端架构特点**:
- React 19 + TypeScript提供类型安全
- Zustand轻量级状态管理
- Ant Design提供一致的UI体验
- 响应式设计适配多端

**代码质量**:
- 统一的错误处理和响应格式
- 复用的工具函数（如标签处理）
- 清晰的文件组织结构

该项目非常适合作为学习现代全栈开发的参考案例。