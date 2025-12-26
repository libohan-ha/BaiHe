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

### 6.1 获取文章评论列表

**GET** `/api/comments?articleId=:articleId`

**响应示例:**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "comments": [],
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

### 6.2 发表评论

**POST** `/api/comments`

**Headers:**
```
Authorization: Bearer <token>
```

**请求体:**
```json
{
  "content": "这是一条评论",
  "articleId": "article_id",
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
    "userId": "xxx",
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

