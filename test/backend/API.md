# API 接口文档

## 基础信息

- **Base URL**: `http://localhost:3000`
- **Content-Type**: `application/json`
- **认证方式**: Bearer Token (JWT)

---

## 统一响应格式

```json
// 成功响应
{
  "code": 200,
  "message": "success",
  "data": { ... }
}

// 错误响应
{
  "code": 400,
  "message": "错误信息",
  "data": null
}
```

---

## 状态码说明

| 状态码 | 说明 |
|--------|------|
| 200 | 成功 |
| 201 | 创建成功 |
| 400 | 请求参数错误 |
| 401 | 未授权 |
| 403 | 禁止访问 |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |

---

## 测试账号

| 邮箱 | 用户名 | 密码 | 角色 |
|------|--------|------|------|
| admin@example.com | admin | 123456 | 管理员 |
| user1@example.com | 张三 | 123456 | 普通用户 |
| user2@example.com | 李四 | 123456 | 普通用户 |

---

## 一、认证接口

### 1.1 用户注册

**POST** `/api/auth/register`

**请求体:**
```json
{
  "email": "user@example.com",
  "username": "newuser",
  "password": "123456"
}
```

**响应示例:**
```json
{
  "code": 200,
  "message": "注册成功",
  "data": {
    "user": {
      "id": "xxx",
      "email": "user@example.com",
      "username": "newuser",
      "avatarUrl": null,
      "bio": null,
      "role": "USER"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

### 1.2 用户登录

**POST** `/api/auth/login`

**请求体:**
```json
{
  "email": "user1@example.com",
  "password": "123456"
}
```

**响应示例:**
```json
{
  "code": 200,
  "message": "登录成功",
  "data": {
    "user": {
      "id": "xxx",
      "email": "user1@example.com",
      "username": "张三",
      "avatarUrl": "https://api.dicebear.com/...",
      "bio": "前端开发者",
      "role": "USER"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**⚠️ 重要：** 登录成功后请保存 `token`，后续需要认证的接口需要在 Header 中传入：
```
Authorization: Bearer <token>
```

---

### 1.3 获取当前用户信息

**GET** `/api/auth/profile`

**Headers:**
```
Authorization: Bearer <token>
```

**响应示例:**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": "xxx",
    "email": "user1@example.com",
    "username": "张三",
    "avatarUrl": "https://api.dicebear.com/...",
    "bio": "前端开发者",
    "role": "USER",
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

---

### 1.4 更新用户信息

**PUT** `/api/auth/profile`

**Headers:**
```
Authorization: Bearer <token>
```

**请求体:**
```json
{
  "username": "新用户名",
  "bio": "新的个人简介",
  "avatarUrl": "https://example.com/avatar.jpg"
}
```

**响应示例:**
```json
{
  "code": 200,
  "message": "更新成功",
  "data": {
    "id": "xxx",
    "email": "user1@example.com",
    "username": "新用户名",
    "avatarUrl": "https://example.com/avatar.jpg",
    "bio": "新的个人简介",
    "role": "USER",
    "updatedAt": "2024-01-02T00:00:00Z"
  }
}
```

---

### 1.5 修改密码

**PUT** `/api/auth/password`

**Headers:**
```
Authorization: Bearer <token>
```

**请求体:**
```json
{
  "oldPassword": "123456",
  "newPassword": "654321"
}
```

**响应示例:**
```json
{
  "code": 200,
  "message": "密码更新成功",
  "data": null
}
```

---

## 二、用户接口

### 2.1 获取指定用户信息

**GET** `/api/users/:id`

**响应示例:**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": "xxx",
    "username": "张三",
    "bio": "前端开发者",
    "avatarUrl": "https://api.dicebear.com/...",
    "role": "USER"
  }
}
```

---

### 2.2 获取用户的文章列表

**GET** `/api/users/:id/articles`

**响应示例:**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "articles": [],
    "pagination": {
      "page": 1,
      "pageSize": 10,
      "total": 0,
      "totalPages": 0
    }
  }
}
```

---

### 2.3 获取用户的收藏列表

**GET** `/api/users/:id/collections`

**Headers:**
```
Authorization: Bearer <token>
```

**响应示例:**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "collections": [],
    "pagination": {
      "page": 1,
      "pageSize": 10,
      "total": 0,
      "totalPages": 0
    }
  }
}
```

---

## 三、文章接口

### 3.1 获取文章列表

**GET** `/api/articles`

**查询参数:**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | number | 否 | 页码，默认 1 |
| pageSize | number | 否 | 每页数量，默认 10 |
| tag | string | 否 | 标签 ID |
| status | string | 否 | 文章状态，默认 PUBLISHED |
| search | string | 否 | 搜索关键词 |
| sort | string | 否 | 排序方式: latest(最新)、popular(热门) |

**响应示例:**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "articles": [
      {
        "id": "xxx",
        "title": "Node.js 入门指南",
        "summary": "本文介绍 Node.js 的基础知识和环境搭建",
        "coverUrl": "https://images.unsplash.com/...",
        "author": {
          "id": "xxx",
          "username": "李四",
          "avatarUrl": "https://api.dicebear.com/..."
        },
        "tags": [
          { "id": "xxx", "name": "JavaScript" },
          { "id": "xxx", "name": "Node.js" }
        ],
        "views": 0,
        "status": "PUBLISHED",
        "createdAt": "2024-01-01T00:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 10,
      "total": 3,
      "totalPages": 1
    }
  }
}
```

---

### 3.2 获取文章详情

**GET** `/api/articles/:id`

**响应示例:**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": "xxx",
    "title": "Node.js 入门指南",
    "summary": "本文介绍 Node.js 的基础知识和环境搭建",
    "content": "# Node.js 入门指南\n\n...",
    "coverUrl": "https://images.unsplash.com/...",
    "views": 0,
    "status": "PUBLISHED",
    "author": {
      "id": "xxx",
      "username": "李四",
      "avatarUrl": "https://api.dicebear.com/..."
    },
    "tags": [
      { "id": "xxx", "name": "JavaScript" },
      { "id": "xxx", "name": "Node.js" }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

---

### 3.3 创建文章

**POST** `/api/articles`

**Headers:**
```
Authorization: Bearer <token>
```

**请求体:**
```json
{
  "title": "我的新文章",
  "summary": "文章摘要",
  "content": "# 文章内容\n\n这里是 Markdown 内容...",
  "coverUrl": "https://example.com/cover.jpg",
  "tagIds": ["tag1_id", "tag2_id"],
  "status": "PUBLISHED"
}
```

**响应示例:**
```json
{
  "code": 200,
  "message": "创建成功",
  "data": {
    "id": "xxx",
    "title": "我的新文章",
    "summary": "文章摘要",
    "content": "# 文章内容\n\n这里是 Markdown 内容...",
    "coverUrl": "https://example.com/cover.jpg",
    "authorId": "xxx",
    "views": 0,
    "status": "PUBLISHED",
    "createdAt": "2024-01-02T00:00:00Z"
  }
}
```

---

### 3.4 更新文章

**PUT** `/api/articles/:id`

**Headers:**
```
Authorization: Bearer <token>
```

**请求体:**
```json
{
  "title": "更新后的标题",
  "summary": "更新后的摘要",
  "content": "更新后的内容...",
  "coverUrl": "https://example.com/new-cover.jpg",
  "tagIds": ["tag1_id"],
  "status": "PUBLISHED"
}
```

**响应示例:**
```json
{
  "code": 200,
  "message": "更新成功",
  "data": {
    "id": "xxx",
    "title": "更新后的标题",
    "updatedAt": "2024-01-03T00:00:00Z"
  }
}
```

---

### 3.5 删除文章

**DELETE** `/api/articles/:id`

**Headers:**
```
Authorization: Bearer <token>
```

**响应示例:**
```json
{
  "code": 200,
  "message": "删除成功",
  "data": null
}
```

---

### 3.6 获取相关文章

**GET** `/api/articles/related/:id`

**响应示例:**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "articles": []
  }
}
```

---

## 四、标签接口

### 4.1 获取标签列表

**GET** `/api/tags`

**响应示例:**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "tags": [
      { "id": "xxx", "name": "JavaScript" },
      { "id": "xxx", "name": "Node.js" },
      { "id": "xxx", "name": "Vue" },
      { "id": "xxx", "name": "React" },
      { "id": "xxx", "name": "数据库" }
    ]
  }
}
```

---

## 五、收藏接口

### 5.1 获取当前用户的收藏列表

**GET** `/api/collections`

**Headers:**
```
Authorization: Bearer <token>
```

**响应示例:**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "collections": [],
    "pagination": {
      "page": 1,
      "pageSize": 10,
      "total": 0,
      "totalPages": 0
    }
  }
}
```

---

### 5.2 收藏文章

**POST** `/api/collections`

**Headers:**
```
Authorization: Bearer <token>
```

**请求体:**
```json
{
  "articleId": "article_id"
}
```

**响应示例:**
```json
{
  "code": 200,
  "message": "收藏成功",
  "data": {
    "id": "xxx",
    "articleId": "article_id",
    "createdAt": "2024-01-02T00:00:00Z"
  }
}
```

---

### 5.3 取消收藏

**DELETE** `/api/collections/:id`

**Headers:**
```
Authorization: Bearer <token>
```

**响应示例:**
```json
{
  "code": 200,
  "message": "取消收藏成功",
  "data": null
}
```

---

## 六、评论接口

评论接口同时支持文章评论和图片评论，通过 `articleId` 或 `imageId` 参数区分。

### 6.1 获取评论列表

**GET** `/api/comments`

**查询参数:**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| articleId | string | 否* | 文章ID |
| imageId | string | 否* | 图片ID |
| page | number | 否 | 页码，默认 1 |
| pageSize | number | 否 | 每页数量，默认 10 |

> *注意：`articleId` 和 `imageId` 必须提供其中一个

**获取文章评论示例:**
```
GET /api/comments?articleId=xxx
```

**获取图片评论示例:**
```
GET /api/comments?imageId=xxx
```

**响应示例:**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "comments": [
      {
        "id": "xxx",
        "content": "这是一条评论",
        "articleId": "article_id",
        "imageId": null,
        "userId": "xxx",
        "user": {
          "id": "xxx",
          "username": "张三",
          "avatarUrl": "/uploads/avatars/xxx.jpg"
        },
        "parentId": null,
        "replies": [],
        "createdAt": "2024-01-02T00:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 10,
      "total": 1,
      "totalPages": 1
    }
  }
}
```

---

### 6.2 发表评论

**POST** `/api/comments`

**Headers:**
```
Authorization: Bearer <token>
```

**请求体:**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| content | string | 是 | 评论内容 |
| articleId | string | 否* | 文章ID |
| imageId | string | 否* | 图片ID |
| parentId | string | 否 | 父评论ID（用于回复） |

> *注意：`articleId` 和 `imageId` 必须提供其中一个

**文章评论请求示例:**
```json
{
  "content": "这是一条文章评论",
  "articleId": "article_id",
  "parentId": null
}
```

**图片评论请求示例:**
```json
{
  "content": "这是一条图片评论",
  "imageId": "image_id",
  "parentId": null
}
```

**响应示例:**
```json
{
  "code": 200,
  "message": "评论成功",
  "data": {
    "id": "xxx",
    "content": "这是一条评论",
    "articleId": "article_id",
    "imageId": null,
    "userId": "xxx",
    "user": {
      "id": "xxx",
      "username": "张三",
      "avatarUrl": "/uploads/avatars/xxx.jpg"
    },
    "parentId": null,
    "createdAt": "2024-01-02T00:00:00Z"
  }
}
```

---

### 6.3 删除评论

**DELETE** `/api/comments/:id`

**Headers:**
```
Authorization: Bearer <token>
```

**响应示例:**
```json
{
  "code": 200,
  "message": "删除成功",
  "data": null
}
```

---

## 七、管理员接口

### 7.1 获取所有用户列表

**GET** `/api/admin/users`

**Headers:**
```
Authorization: Bearer <admin_token>
```

**响应示例:**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "users": [],
    "pagination": {
      "page": 1,
      "pageSize": 10,
      "total": 0,
      "totalPages": 0
    }
  }
}
```

---

### 7.2 更新用户角色

**PUT** `/api/admin/users/:id/role`

**Headers:**
```
Authorization: Bearer <admin_token>
```

**请求体:**
```json
{
  "role": "ADMIN"
}
```

**响应示例:**
```json
{
  "code": 200,
  "message": "更新成功",
  "data": {
    "id": "xxx",
    "role": "ADMIN"
  }
}
```

---

### 7.3 删除用户

**DELETE** `/api/admin/users/:id`

**Headers:**
```
Authorization: Bearer <admin_token>
```

**响应示例:**
```json
{
  "code": 200,
  "message": "删除成功",
  "data": null
}
```

---

### 7.4 获取所有文章列表（管理）

**GET** `/api/admin/articles`

**Headers:**
```
Authorization: Bearer <admin_token>
```

---

### 7.5 更新文章状态

**PUT** `/api/admin/articles/:id/status`

**Headers:**
```
Authorization: Bearer <admin_token>
```

**请求体:**
```json
{
  "status": "DRAFT"
}
```

---

### 7.6 删除文章（管理）

**DELETE** `/api/admin/articles/:id`

**Headers:**
```
Authorization: Bearer <admin_token>
```

---

## 八、健康检查

### 8.1 服务健康检查

**GET** `/api/health`

**响应示例:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

---

## 九、图片画廊接口

### 9.1 获取图片列表

**GET** `/api/images`

**查询参数:**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | number | 否 | 页码，默认 1 |
| pageSize | number | 否 | 每页数量，默认 10 |
| tag | string | 否 | 标签 ID 或名称 |
| search | string | 否 | 搜索关键词（标题、描述） |
| sort | string | 否 | 排序方式: latest(最新)、popular(热门) |

**响应示例:**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "images": [
      {
        "id": "xxx",
        "title": "美丽的风景",
        "imageUrl": "/uploads/gallery/xxx.jpg",
        "thumbnailUrl": null,
        "description": "这是一张美丽的风景图片",
        "authorId": "xxx",
        "author": {
          "id": "xxx",
          "username": "张三",
          "avatarUrl": "/uploads/avatars/xxx.jpg"
        },
        "tags": [
          { "id": "xxx", "name": "风景" },
          { "id": "xxx", "name": "自然" }
        ],
        "views": 100,
        "createdAt": "2024-01-01T00:00:00Z",
        "updatedAt": "2024-01-01T00:00:00Z"
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

---

### 9.2 获取图片详情

**GET** `/api/images/:id`

**响应示例:**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": "xxx",
    "title": "美丽的风景",
    "imageUrl": "/uploads/gallery/xxx.jpg",
    "thumbnailUrl": null,
    "description": "这是一张美丽的风景图片",
    "authorId": "xxx",
    "author": {
      "id": "xxx",
      "username": "张三",
      "avatarUrl": "/uploads/avatars/xxx.jpg",
      "bio": "摄影爱好者"
    },
    "tags": [
      { "id": "xxx", "name": "风景" }
    ],
    "views": 101,
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

---

### 9.3 上传图片文件

**POST** `/api/upload/gallery`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**请求体:**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| file | File | 是 | 图片文件（支持 jpg, png, gif, webp） |

**响应示例:**
```json
{
  "code": 200,
  "message": "上传成功",
  "data": {
    "url": "/uploads/gallery/xxx_123456_abc.jpg",
    "filename": "xxx_123456_abc.jpg",
    "originalName": "my-image.jpg",
    "size": 1024000,
    "mimetype": "image/jpeg"
  }
}
```

---

### 9.4 创建图片

**POST** `/api/images`

**Headers:**
```
Authorization: Bearer <token>
```

**请求体:**
```json
{
  "title": "我的新图片",
  "imageUrl": "/uploads/gallery/xxx.jpg",
  "thumbnailUrl": "/uploads/gallery/xxx_thumb.jpg",
  "description": "图片描述（可选）",
  "tagIds": ["tag1_id", "tag2_id"]
}
```

**响应示例:**
```json
{
  "code": 200,
  "message": "创建成功",
  "data": {
    "id": "xxx",
    "title": "我的新图片",
    "imageUrl": "/uploads/gallery/xxx.jpg",
    "thumbnailUrl": "/uploads/gallery/xxx_thumb.jpg",
    "description": "图片描述",
    "authorId": "xxx",
    "author": {
      "id": "xxx",
      "username": "张三",
      "avatarUrl": "/uploads/avatars/xxx.jpg"
    },
    "tags": [
      { "id": "tag1_id", "name": "标签1" }
    ],
    "views": 0,
    "createdAt": "2024-01-02T00:00:00Z"
  }
}
```

---

### 9.5 更新图片

**PUT** `/api/images/:id`

**Headers:**
```
Authorization: Bearer <token>
```

**请求体:**
```json
{
  "title": "更新后的标题",
  "description": "更新后的描述",
  "tagIds": ["tag1_id"]
}
```

**响应示例:**
```json
{
  "code": 200,
  "message": "更新成功",
  "data": {
    "id": "xxx",
    "title": "更新后的标题",
    "description": "更新后的描述",
    "updatedAt": "2024-01-03T00:00:00Z"
  }
}
```

---

### 9.6 删除图片

**DELETE** `/api/images/:id`

**Headers:**
```
Authorization: Bearer <token>
```

**响应示例:**
```json
{
  "code": 200,
  "message": "删除成功",
  "data": null
}
```

---

### 9.7 获取用户的图片列表

**GET** `/api/users/:id/images`

**查询参数:**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | number | 否 | 页码，默认 1 |
| pageSize | number | 否 | 每页数量，默认 10 |

**响应示例:**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "images": [],
    "pagination": {
      "page": 1,
      "pageSize": 10,
      "total": 0,
      "totalPages": 0
    }
  }
}
```

---

## 十、图片标签接口

### 10.1 获取图片标签列表

**GET** `/api/image-tags`

**响应示例:**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "tags": [
      { "id": "xxx", "name": "风景", "imageCount": 10 },
      { "id": "xxx", "name": "人物", "imageCount": 8 },
      { "id": "xxx", "name": "动漫", "imageCount": 15 }
    ]
  }
}
```

---

### 10.2 获取热门图片标签

**GET** `/api/image-tags/popular`

**查询参数:**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| limit | number | 否 | 返回数量，默认 10 |

**响应示例:**
```json
{
  "code": 200,
  "message": "success",
  "data": [
    { "id": "xxx", "name": "动漫", "imageCount": 15 },
    { "id": "xxx", "name": "风景", "imageCount": 10 }
  ]
}
```

---

### 10.3 获取单个图片标签

**GET** `/api/image-tags/:id`

**响应示例:**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": "xxx",
    "name": "风景",
    "imageCount": 10,
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

---

### 10.4 创建图片标签

**POST** `/api/image-tags`

**Headers:**
```
Authorization: Bearer <token>
```

**请求体:**
```json
{
  "name": "新标签"
}
```

**响应示例:**
```json
{
  "code": 200,
  "message": "创建成功",
  "data": {
    "id": "xxx",
    "name": "新标签",
    "createdAt": "2024-01-02T00:00:00Z"
  }
}
```

---

### 10.5 更新图片标签（管理员）

**PUT** `/api/image-tags/:id`

**Headers:**
```
Authorization: Bearer <admin_token>
```

**请求体:**
```json
{
  "name": "更新后的标签名"
}
```

**响应示例:**
```json
{
  "code": 200,
  "message": "更新成功",
  "data": {
    "id": "xxx",
    "name": "更新后的标签名"
  }
}
```

---

### 10.6 删除图片标签（管理员）

**DELETE** `/api/image-tags/:id`

**Headers:**
```
Authorization: Bearer <admin_token>
```

**响应示例:**
```json
{
  "code": 200,
  "message": "删除成功",
  "data": null
}
```

---

## 十一、图片收藏接口

### 11.1 获取用户收藏的图片列表

**GET** `/api/image-collections`

**Headers:**
```
Authorization: Bearer <token>
```

**查询参数:**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | number | 否 | 页码，默认 1 |
| pageSize | number | 否 | 每页数量，默认 10 |

**响应示例:**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "collections": [
      {
        "id": "collection_id",
        "imageId": "image_id",
        "image": {
          "id": "image_id",
          "title": "美丽的风景",
          "imageUrl": "/uploads/gallery/xxx.jpg",
          "author": {
            "id": "xxx",
            "username": "张三"
          }
        },
        "createdAt": "2024-01-02T00:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 10,
      "total": 5,
      "totalPages": 1
    }
  }
}
```

---

### 11.2 收藏图片

**POST** `/api/image-collections`

**Headers:**
```
Authorization: Bearer <token>
```

**请求体:**
```json
{
  "imageId": "image_id"
}
```

**响应示例:**
```json
{
  "code": 200,
  "message": "收藏成功",
  "data": {
    "id": "collection_id",
    "imageId": "image_id",
    "createdAt": "2024-01-02T00:00:00Z"
  }
}
```

---

### 11.3 检查是否已收藏图片

**GET** `/api/image-collections/check/:imageId`

**Headers:**
```
Authorization: Bearer <token>
```

**响应示例:**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "collected": true,
    "collectionId": "collection_id"
  }
}
```

---

### 11.4 取消收藏（通过收藏ID）

**DELETE** `/api/image-collections/:id`

**Headers:**
```
Authorization: Bearer <token>
```

**响应示例:**
```json
{
  "code": 200,
  "message": "取消收藏成功",
  "data": null
}
```

---

### 11.5 取消收藏（通过图片ID）

**DELETE** `/api/image-collections/image/:imageId`

**Headers:**
```
Authorization: Bearer <token>
```

**响应示例:**
```json
{
  "code": 200,
  "message": "取消收藏成功",
  "data": null
}
```

---

## 十二、文件上传接口

### 12.1 上传头像

**POST** `/api/upload/avatar`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**请求体:**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| file | File | 是 | 头像图片文件 |

**响应示例:**
```json
{
  "code": 200,
  "message": "上传成功",
  "data": {
    "url": "/uploads/avatars/xxx_123456_abc.jpg",
    "filename": "xxx_123456_abc.jpg",
    "originalName": "avatar.jpg",
    "size": 102400,
    "mimetype": "image/jpeg"
  }
}
```

---

### 12.2 上传封面

**POST** `/api/upload/cover`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**请求体:**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| file | File | 是 | 封面图片文件 |

**响应示例:**
```json
{
  "code": 200,
  "message": "上传成功",
  "data": {
    "url": "/uploads/covers/xxx_123456_abc.jpg",
    "filename": "xxx_123456_abc.jpg",
    "originalName": "cover.jpg",
    "size": 204800,
    "mimetype": "image/jpeg"
  }
}
```

---

### 12.3 删除已上传文件

**DELETE** `/api/upload`

**Headers:**
```
Authorization: Bearer <token>
```

**请求体:**
```json
{
  "url": "/uploads/gallery/xxx.jpg"
}
```

**响应示例:**
```json
{
  "code": 200,
  "message": "删除成功",
  "data": null
}
```

---

## 十三、管理员图片接口

### 13.1 获取所有图片（管理员）

**GET** `/api/admin/images`

**Headers:**
```
Authorization: Bearer <admin_token>
```

**查询参数:**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | number | 否 | 页码，默认 1 |
| pageSize | number | 否 | 每页数量，默认 20 |
| uploaderId | string | 否 | 上传者 ID |
| search | string | 否 | 搜索关键词 |

**响应示例:**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "images": [
      {
        "id": "xxx",
        "title": "图片标题",
        "imageUrl": "/uploads/gallery/xxx.jpg",
        "author": {
          "id": "xxx",
          "username": "张三",
          "email": "zhangsan@example.com"
        },
        "views": 100,
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

---

### 13.2 删除图片（管理员）

**DELETE** `/api/admin/images/:id`

**Headers:**
```
Authorization: Bearer <admin_token>
```

**响应示例:**
```json
{
  "code": 200,
  "message": "删除成功",
  "data": null
}
```

---