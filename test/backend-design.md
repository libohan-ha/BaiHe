# 后端设计文档

## 1. 技术栈

- **运行环境：** Node.js
- **Web框架：** Express.js
- **数据库：** PostgreSQL
- **ORM：** Prisma
- **身份验证：** JWT (jsonwebtoken)
- **密码加密：** bcrypt
- **文件上传：** 阿里云OSS直传
- **环境变量：** dotenv
- **跨域：** cors
- **参数验证：** express-validator
- **日志：** morgan

---

## 2. 项目目录结构

```
backend/
├── prisma/
│   ├── schema.prisma          # Prisma数据模型定义
│   └── migrations/            # 数据库迁移文件
├── src/
│   ├── config/
│   │   ├── database.js        # 数据库连接配置
│   │   └── oss.js             # 阿里云OSS配置
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── user.controller.js
│   │   ├── article.controller.js
│   │   ├── tag.controller.js
│   │   ├── collection.controller.js
│   │   ├── comment.controller.js
│   │   └── admin.controller.js
│   ├── middleware/
│   │   ├── auth.middleware.js     # JWT验证中间件
│   │   ├── admin.middleware.js    # 管理员权限验证
│   │   ├── errorHandler.js        # 统一错误处理
│   │   └── validator.js           # 参数验证中间件
│   ├── models/
│   │   └── prisma.js              # Prisma客户端实例
│   ├── routes/
│   │   ├── index.js               # 路由汇总
│   │   ├── auth.routes.js
│   │   ├── user.routes.js
│   │   ├── article.routes.js
│   │   ├── tag.routes.js
│   │   ├── collection.routes.js
│   │   ├── comment.routes.js
│   │   └── admin.routes.js
│   ├── services/
│   │   ├── auth.service.js
│   │   ├── user.service.js
│   │   ├── article.service.js
│   │   ├── tag.service.js
│   │   ├── collection.service.js
│   │   ├── comment.service.js
│   │   └── oss.service.js
│   ├── utils/
│   │   ├── response.js            # 统一响应格式
│   │   └── logger.js              # 日志工具
│   └── app.js                     # Express应用入口
├── .env                          # 环境变量
├── .env.example                  # 环境变量示例
├── .gitignore
├── package.json
├── Dockerfile
└── README.md
```

---

## 3. 数据库设计

### 3.1 Prisma Schema

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum UserRole {
  USER
  ADMIN
}

enum ArticleStatus {
  DRAFT
  PUBLISHED
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  username  String   @unique
  password  String
  avatarUrl String?
  bio       String?
  role      UserRole @default(USER)
  articles  Article[]
  collections Collection[]
  comments  Comment[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([email])
  @@index([username])
}

model Article {
  id          String        @id @default(cuid())
  title       String
  summary     String
  content     String
  coverUrl    String?
  authorId    String
  author      User          @relation(fields: [authorId], references: [id], onDelete: Cascade)
  views       Int           @default(0)
  status      ArticleStatus @default(PUBLISHED)
  tags        Tag[]
  collections Collection[]
  comments    Comment[]
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt

  @@index([authorId])
  @@index([status])
  @@index([createdAt])
}

model Tag {
  id        String    @id @default(cuid())
  name      String    @unique
  articles  Article[]
  createdAt DateTime  @default(now())

  @@index([name])
}

model Collection {
  id        String   @id @default(cuid())
  userId    String
  articleId String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  article   Article  @relation(fields: [articleId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())

  @@unique([userId, articleId])
  @@index([userId])
  @@index([articleId])
}

model Comment {
  id        String   @id @default(cuid())
  content   String
  articleId String
  userId    String
  parentId  String?
  article   Article  @relation(fields: [articleId], references: [id], onDelete: Cascade)
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  parent    Comment? @relation("CommentReplies", fields: [parentId], references: [id], onDelete: Cascade)
  replies   Comment[] @relation("CommentReplies")
  createdAt DateTime @default(now())

  @@index([articleId])
  @@index([userId])
  @@index([parentId])
}
```

---

## 4. API 接口设计

### 4.1 统一响应格式

```javascript
// 成功响应
{
  "code": 200,
  "message": "success",
  "data": { ... }
}

// 错误响应
{
  "code": 400,
  "message": "error message",
  "data": null
}
```

### 4.2 状态码说明

| Code | 说明 |
|------|------|
| 200  | 成功 |
| 400  | 请求参数错误 |
| 401  | 未授权（未登录或token无效） |
| 403  | 禁止访问（权限不足） |
| 404  | 资源不存在 |
| 500  | 服务器内部错误 |

---

### 4.3 认证接口 (`/api/auth`)

| 方法 | 路径 | 描述 | 认证 |
|------|------|------|------|
| POST | `/api/auth/register` | 用户注册 | 否 |
| POST | `/api/auth/login` | 用户登录 | 否 |
| POST | `/api/auth/logout` | 用户登出 | 是 |
| POST | `/api/auth/refresh` | 刷新Token | 否 |
| POST | `/api/auth/forgot-password` | 忘记密码 | 否 |
| POST | `/api/auth/reset-password` | 重置密码 | 否 |

#### POST `/api/auth/register` - 用户注册

**请求体：**
```json
{
  "email": "user@example.com",
  "username": "testuser",
  "password": "password123"
}
```

**响应：**
```json
{
  "code": 200,
  "message": "注册成功",
  "data": {
    "user": {
      "id": "xxx",
      "email": "user@example.com",
      "username": "testuser",
      "avatarUrl": null,
      "bio": null,
      "role": "USER"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### POST `/api/auth/login` - 用户登录

**请求体：**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**响应：**
```json
{
  "code": 200,
  "message": "登录成功",
  "data": {
    "user": {
      "id": "xxx",
      "email": "user@example.com",
      "username": "testuser",
      "avatarUrl": null,
      "bio": null,
      "role": "USER"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

### 4.4 用户接口 (`/api/users`)

| 方法 | 路径 | 描述 | 认证 |
|------|------|------|------|
| GET | `/api/users/profile` | 获取当前用户信息 | 是 |
| PUT | `/api/users/profile` | 更新当前用户信息 | 是 |
| GET | `/api/users/:id` | 获取指定用户信息 | 否 |
| PUT | `/api/users/avatar` | 上传头像 | 是 |
| GET | `/api/users/:id/articles` | 获取用户的文章列表 | 否 |
| GET | `/api/users/:id/collections` | 获取用户的收藏列表 | 是 |

#### GET `/api/users/profile` - 获取当前用户信息

**响应：**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": "xxx",
    "email": "user@example.com",
    "username": "testuser",
    "avatarUrl": "https://oss.example.com/avatar.jpg",
    "bio": "这是个人简介",
    "role": "USER",
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

#### PUT `/api/users/profile` - 更新当前用户信息

**请求体：**
```json
{
  "username": "newusername",
  "bio": "新的个人简介"
}
```

**响应：**
```json
{
  "code": 200,
  "message": "更新成功",
  "data": {
    "id": "xxx",
    "email": "user@example.com",
    "username": "newusername",
    "avatarUrl": "https://oss.example.com/avatar.jpg",
    "bio": "新的个人简介",
    "role": "USER"
  }
}
```

---

### 4.5 文章接口 (`/api/articles`)

| 方法 | 路径 | 描述 | 认证 |
|------|------|------|------|
| GET | `/api/articles` | 获取文章列表 | 否 |
| GET | `/api/articles/:id` | 获取文章详情 | 否 |
| POST | `/api/articles` | 创建文章 | 是 |
| PUT | `/api/articles/:id` | 更新文章 | 是 |
| DELETE | `/api/articles/:id` | 删除文章 | 是 |
| GET | `/api/articles/related/:id` | 获取相关文章 | 否 |

#### GET `/api/articles` - 获取文章列表

**查询参数：**
- `page` (可选): 页码，默认1
- `pageSize` (可选): 每页数量，默认10
- `tag` (可选): 标签ID，按标签筛选
- `status` (可选): 文章状态，默认PUBLISHED
- `search` (可选): 搜索关键词
- `sort` (可选): 排序方式，`latest`最新、`popular`热门，默认latest

**请求示例：**
```
GET /api/articles?page=1&pageSize=10&tag=xxx&search=关键词
```

**响应：**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "articles": [
      {
        "id": "xxx",
        "title": "文章标题",
        "summary": "文章摘要",
        "coverUrl": "https://oss.example.com/cover.jpg",
        "author": {
          "id": "xxx",
          "username": "author",
          "avatarUrl": "https://oss.example.com/avatar.jpg"
        },
        "tags": [
          { "id": "xxx", "name": "标签1" },
          { "id": "xxx", "name": "标签2" }
        ],
        "views": 100,
        "status": "PUBLISHED",
        "createdAt": "2024-01-01T00:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 10,
      "total": 100,
      "totalPages": 10
    }
  }
}
```

#### GET `/api/articles/:id` - 获取文章详情

**响应：**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": "xxx",
    "title": "文章标题",
    "summary": "文章摘要",
    "content": "# 文章正文\n\n这里是Markdown内容...",
    "coverUrl": "https://oss.example.com/cover.jpg",
    "author": {
      "id": "xxx",
      "username": "author",
      "avatarUrl": "https://oss.example.com/avatar.jpg"
    },
    "tags": [
      { "id": "xxx", "name": "标签1" },
      { "id": "xxx", "name": "标签2" }
    ],
    "views": 100,
    "status": "PUBLISHED",
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-02T00:00:00Z"
  }
}
```

#### POST `/api/articles` - 创建文章

**请求体：**
```json
{
  "title": "文章标题",
  "summary": "文章摘要",
  "content": "# 文章正文\n\n这里是Markdown内容...",
  "coverUrl": "https://oss.example.com/cover.jpg",
  "tagIds": ["tag1", "tag2"],
  "status": "PUBLISHED"
}
```

**响应：**
```json
{
  "code": 200,
  "message": "创建成功",
  "data": {
    "id": "xxx",
    "title": "文章标题",
    "summary": "文章摘要",
    "content": "# 文章正文\n\n这里是Markdown内容...",
    "coverUrl": "https://oss.example.com/cover.jpg",
    "authorId": "xxx",
    "views": 0,
    "status": "PUBLISHED",
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

#### PUT `/api/articles/:id` - 更新文章

**权限：** 仅作者本人或管理员

**请求体：**
```json
{
  "title": "更新后的标题",
  "summary": "更新后的摘要",
  "content": "更新后的内容...",
  "coverUrl": "https://oss.example.com/new-cover.jpg",
  "tagIds": ["tag1"],
  "status": "PUBLISHED"
}
```

**响应：**
```json
{
  "code": 200,
  "message": "更新成功",
  "data": {
    "id": "xxx",
    "title": "更新后的标题",
    "summary": "更新后的摘要",
    "content": "更新后的内容...",
    "coverUrl": "https://oss.example.com/new-cover.jpg",
    "views": 100,
    "status": "PUBLISHED",
    "updatedAt": "2024-01-03T00:00:00Z"
  }
}
```

#### DELETE `/api/articles/:id` - 删除文章

**权限：** 仅作者本人或管理员

**响应：**
```json
{
  "code": 200,
  "message": "删除成功",
  "data": null
}
```

---

### 4.6 标签接口 (`/api/tags`)

| 方法 | 路径 | 描述 | 认证 |
|------|------|------|------|
| GET | `/api/tags` | 获取标签列表 | 否 |
| GET | `/api/tags/popular` | 获取热门标签 | 否 |
| GET | `/api/tags/:id` | 获取标签详情 | 否 |
| POST | `/api/tags` | 创建标签 | 是 |
| PUT | `/api/tags/:id` | 更新标签 | 是（管理员） |
| DELETE | `/api/tags/:id` | 删除标签 | 是（管理员） |

#### GET `/api/tags` - 获取标签列表

**查询参数：**
- `page` (可选): 页码，默认1
- `pageSize` (可选): 每页数量，默认20
- `search` (可选): 搜索关键词

**响应：**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "tags": [
      {
        "id": "xxx",
        "name": "标签名",
        "articleCount": 50,
        "createdAt": "2024-01-01T00:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "total": 100,
      "totalPages": 5
    }
  }
}
```

#### GET `/api/tags/popular` - 获取热门标签

**查询参数：**
- `limit` (可选): 返回数量，默认10

**响应：**
```json
{
  "code": 200,
  "message": "success",
  "data": [
    {
      "id": "xxx",
      "name": "热门标签1",
      "articleCount": 100
    },
    {
      "id": "xxx",
      "name": "热门标签2",
      "articleCount": 80
    }
  ]
}
```

#### POST `/api/tags` - 创建标签

**请求体：**
```json
{
  "name": "新标签"
}
```

**响应：**
```json
{
  "code": 200,
  "message": "创建成功",
  "data": {
    "id": "xxx",
    "name": "新标签",
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

---

### 4.7 收藏接口 (`/api/collections`)

| 方法 | 路径 | 描述 | 认证 |
|------|------|------|------|
| GET | `/api/collections` | 获取我的收藏列表 | 是 |
| POST | `/api/collections` | 收藏文章 | 是 |
| DELETE | `/api/collections/:articleId` | 取消收藏 | 是 |
| GET | `/api/collections/check/:articleId` | 检查是否已收藏 | 是 |

#### GET `/api/collections` - 获取我的收藏列表

**查询参数：**
- `page` (可选): 页码，默认1
- `pageSize` (可选): 每页数量，默认10

**响应：**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "collections": [
      {
        "id": "xxx",
        "article": {
          "id": "xxx",
          "title": "文章标题",
          "summary": "文章摘要",
          "coverUrl": "https://oss.example.com/cover.jpg",
          "author": {
            "id": "xxx",
            "username": "author"
          },
          "tags": [
            { "id": "xxx", "name": "标签1" }
          ],
          "views": 100,
          "createdAt": "2024-01-01T00:00:00Z"
        },
        "createdAt": "2024-01-01T00:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 10,
      "total": 50,
      "totalPages": 5
    }
  }
}
```

#### POST `/api/collections` - 收藏文章

**请求体：**
```json
{
  "articleId": "xxx"
}
```

**响应：**
```json
{
  "code": 200,
  "message": "收藏成功",
  "data": {
    "id": "xxx",
    "articleId": "xxx",
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

#### DELETE `/api/collections/:articleId` - 取消收藏

**响应：**
```json
{
  "code": 200,
  "message": "取消收藏成功",
  "data": null
}
```

---

### 4.8 评论接口 (`/api/comments`)

| 方法 | 路径 | 描述 | 认证 |
|------|------|------|------|
| GET | `/api/comments/article/:articleId` | 获取文章评论列表 | 否 |
| POST | `/api/comments` | 发表评论 | 是 |
| PUT | `/api/comments/:id` | 更新评论 | 是（仅作者） |
| DELETE | `/api/comments/:id` | 删除评论 | 是（仅作者或管理员） |

#### GET `/api/comments/article/:articleId` - 获取文章评论列表

**查询参数：**
- `page` (可选): 页码，默认1
- `pageSize` (可选): 每页数量，默认20

**响应：**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "comments": [
      {
        "id": "xxx",
        "content": "评论内容",
        "user": {
          "id": "xxx",
          "username": "评论者",
          "avatarUrl": "https://oss.example.com/avatar.jpg"
        },
        "parentId": null,
        "replies": [
          {
            "id": "xxx",
            "content": "回复内容",
            "user": {
              "id": "xxx",
              "username": "回复者",
              "avatarUrl": "https://oss.example.com/avatar.jpg"
            },
            "createdAt": "2024-01-01T01:00:00Z"
          }
        ],
        "createdAt": "2024-01-01T00:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "total": 50,
      "totalPages": 3
    }
  }
}
```

#### POST `/api/comments` - 发表评论

**请求体：**
```json
{
  "articleId": "xxx",
  "content": "评论内容",
  "parentId": "xxx"
}
```

**响应：**
```json
{
  "code": 200,
  "message": "评论成功",
  "data": {
    "id": "xxx",
    "content": "评论内容",
    "articleId": "xxx",
    "userId": "xxx",
    "parentId": "xxx",
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

---

### 4.9 文件上传接口 (`/api/upload`)

| 方法 | 路径 | 描述 | 认证 |
|------|------|------|------|
| POST | `/api/upload/signature` | 获取OSS上传签名 | 是 |

#### POST `/api/upload/signature` - 获取OSS上传签名

**请求体：**
```json
{
  "filename": "image.jpg",
  "fileType": "image/jpeg",
  "type": "avatar"
}
```

**type参数说明：**
- `avatar`: 头像上传
- `cover`: 文章封面上传

**响应：**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "uploadUrl": "https://bucket.oss-cn-hangzhou.aliyuncs.com/xxx",
    "signature": "xxx",
    "policy": "xxx",
    "accessKeyId": "xxx",
    "key": "uploads/2024/01/01/xxx.jpg",
    "host": "https://bucket.oss-cn-hangzhou.aliyuncs.com",
    "expire": 1704105600
  }
}
```

---

### 4.10 管理员接口 (`/api/admin`)

| 方法 | 路径 | 描述 | 认证 |
|------|------|------|------|
| GET | `/api/admin/articles` | 获取所有文章（含草稿） | 管理员 |
| GET | `/api/admin/users` | 获取用户列表 | 管理员 |
| PUT | `/api/admin/users/:id/role` | 修改用户角色 | 管理员 |
| DELETE | `/api/admin/articles/:id` | 删除任意文章 | 管理员 |
| PUT | `/api/admin/articles/:id/status` | 修改文章状态 | 管理员 |
| DELETE | `/api/admin/comments/:id` | 删除任意评论 | 管理员 |

#### GET `/api/admin/articles` - 获取所有文章

**查询参数：**
- `page` (可选): 页码，默认1
- `pageSize` (可选): 每页数量，默认20
- `status` (可选): 文章状态筛选
- `authorId` (可选): 按作者筛选

**响应：**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "articles": [
      {
        "id": "xxx",
        "title": "文章标题",
        "summary": "文章摘要",
        "author": {
          "id": "xxx",
          "username": "author",
          "email": "author@example.com"
        },
        "status": "PUBLISHED",
        "views": 100,
        "createdAt": "2024-01-01T00:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "total": 200,
      "totalPages": 10
    }
  }
}
```

#### PUT `/api/admin/users/:id/role` - 修改用户角色

**请求体：**
```json
{
  "role": "ADMIN"
}
```

**响应：**
```json
{
  "code": 200,
  "message": "角色修改成功",
  "data": {
    "id": "xxx",
    "username": "testuser",
    "role": "ADMIN"
  }
}
```

---

## 5. 环境变量配置

```env
# .env

# 数据库配置
DATABASE_URL="postgresql://username:password@localhost:5432/yuri_archive?schema=public"

# JWT配置
JWT_SECRET="your-super-secret-jwt-key"
JWT_EXPIRES_IN="7d"

# 阿里云OSS配置
OSS_REGION="oss-cn-hangzhou"
OSS_ACCESS_KEY_ID="your-access-key-id"
OSS_ACCESS_KEY_SECRET="your-access-key-secret"
OSS_BUCKET="your-bucket-name"

# 服务器配置
PORT=3000
NODE_ENV="development"

# CORS配置
CORS_ORIGIN="http://localhost:5173"
```

---

## 6. 中间件设计

### 6.1 认证中间件 (`auth.middleware.js`)

验证JWT Token，将用户信息附加到请求对象。

```javascript
const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ code: 401, message: '未登录', data: null });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    if (!user) {
      return res.status(401).json({ code: 401, message: '用户不存在', data: null });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ code: 401, message: 'Token无效', data: null });
  }
};
```

### 6.2 管理员中间件 (`admin.middleware.js`)

验证用户是否为管理员。

```javascript
const adminMiddleware = (req, res, next) => {
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ code: 403, message: '权限不足', data: null });
  }
  next();
};
```

---

## 7. 错误处理

### 7.1 统一错误处理中间件

```javascript
const errorHandler = (err, req, res, next) => {
  console.error(err);

  if (err.name === 'PrismaClientKnownRequestError') {
    if (err.code === 'P2002') {
      return res.status(400).json({ code: 400, message: '数据已存在', data: null });
    }
    if (err.code === 'P2025') {
      return res.status(404).json({ code: 404, message: '记录不存在', data: null });
    }
  }

  res.status(500).json({ code: 500, message: '服务器内部错误', data: null });
};
```

---

## 8. 数据库索引优化

已在Prisma Schema中添加以下索引：
- User表：email、username
- Article表：authorId、status、createdAt
- Tag表：name
- Collection表：userId、articleId
- Comment表：articleId、userId、parentId

---

## 9. 安全措施

1. **密码加密：** 使用bcrypt，saltRounds=10
2. **JWT Token：** 有效期7天，存储在Authorization Header
3. **输入验证：** 使用express-validator验证所有输入
4. **SQL注入防护：** Prisma ORM自动防护
5. **XSS防护：** 前端渲染时进行转义
6. **CORS配置：** 仅允许指定域名访问
7. **文件上传：** 使用OSS直传，后端仅生成签名
8. **敏感信息：** 环境变量管理，不提交到版本控制

---

## 10. Docker部署配置

### Dockerfile

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

RUN npx prisma generate

EXPOSE 3000

CMD ["node", "src/app.js"]
```

### docker-compose.yml

```yaml
version: '3.8'

services:
  api:
    build: ./backend
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://postgres:postgres@db:5432/yuri_archive?schema=public
      - JWT_SECRET=${JWT_SECRET}
      - OSS_REGION=${OSS_REGION}
      - OSS_ACCESS_KEY_ID=${OSS_ACCESS_KEY_ID}
      - OSS_ACCESS_KEY_SECRET=${OSS_ACCESS_KEY_SECRET}
      - OSS_BUCKET=${OSS_BUCKET}
    depends_on:
      - db
    volumes:
      - ./backend:/app
      - /app/node_modules

  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres
      - POSTGRES_DB=yuri_archive
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

---

## 11. 开发流程

1. **初始化项目：**
   ```bash
   cd backend
   npm init -y
   npm install express prisma @prisma/client jsonwebtoken bcrypt cors dotenv morgan express-validator
   npm install -D nodemon
   ```

2. **初始化Prisma：**
   ```bash
   npx prisma init
   ```

3. **创建数据库迁移：**
   ```bash
   npx prisma migrate dev --name init
   ```

4. **启动开发服务器：**
   ```bash
   npm run dev
   ```

5. **生成Prisma Client：**
   ```bash
   npx prisma generate
   ```

---

## 12. 待确认事项

- [ ] 是否需要文章审核功能？
- [ ] 是否需要文章举报功能？
- [ ] 是否需要用户关注/订阅功能？
- [ ] 是否需要文章点赞功能？
- [ ] 是否需要全文检索（Elasticsearch）？
- [ ] 是否需要邮件发送功能（注册验证、密码重置）？
- [ ] 是否需要Redis缓存？
- [ ] 数据库备份策略？
