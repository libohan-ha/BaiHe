# 图片无法显示问题诊断指南

## 问题现象
上传的图片（头像、封面、图库图片）无法显示，显示为占位符或空白。

## 可能的原因和解决方案

### 1. 后端服务未运行

**检查方法：**
```bash
# 检查后端是否在运行
curl http://localhost:3000/api/health
```

**解决方案：**
```bash
cd test/backend
npm install
npm start
```

### 2. 图片上传目录不存在

**检查方法：**
```bash
# 检查上传目录是否存在
ls -la test/backend/uploads/
ls -la test/backend/uploads/avatars/
ls -la test/backend/uploads/covers/
ls -la test/backend/uploads/gallery/
```

**解决方案：**
```bash
cd test/backend
mkdir -p uploads/avatars uploads/covers uploads/gallery
```

### 3. 开发环境配置问题

**当前配置：**
- `BACKEND_URL` 在开发环境 = `http://localhost:3000`
- 图片路径示例：`/uploads/avatars/xxx.jpg`
- 完整URL：`http://localhost:3000/uploads/avatars/xxx.jpg`

**检查方法：**
打开浏览器开发者工具（F12）→ Network 标签，查看图片请求：
- 请求URL是什么？
- 状态码是什么？（200 = 成功，404 = 未找到，500 = 服务器错误）
- 响应内容是什么？

### 4. CORS 问题

如果看到 CORS 错误，检查后端 CORS 配置：

**文件：** `test/backend/src/app.js`

```javascript
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));
```

确保 `CORS_ORIGIN` 包含前端地址。

### 5. 静态文件服务配置

**检查后端静态文件配置：**

**文件：** `test/backend/src/app.js`

```javascript
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
```

这行代码应该存在，确保 `/uploads` 路径可以访问上传的文件。

### 6. 图片路径格式问题

**后端返回的路径格式应该是：**
```json
{
  "code": 200,
  "message": "上传成功",
  "data": {
    "url": "/uploads/avatars/1234567890-avatar.jpg",
    "filename": "1234567890-avatar.jpg",
    "originalName": "my-avatar.jpg",
    "size": 12345,
    "mimetype": "image/jpeg"
  }
}
```

**前端 `getImageUrl()` 函数会将其转换为：**
- 开发环境：`http://localhost:3000/uploads/avatars/1234567890-avatar.jpg`
- 生产环境：`/uploads/avatars/1234567890-avatar.jpg`（通过 Nginx 代理）

## 调试步骤

### 步骤 1：检查后端是否运行
```bash
curl http://localhost:3000/api/health
```
应该返回：`{"status":"ok","timestamp":"..."}`

### 步骤 2：手动上传测试
```bash
# 使用 curl 测试上传（需要先登录获取 token）
curl -X POST http://localhost:3000/api/upload/avatar \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@/path/to/test-image.jpg"
```

### 步骤 3：检查上传的文件
```bash
ls -la test/backend/uploads/avatars/
```

### 步骤 4：直接访问图片
在浏览器中访问：
```
http://localhost:3000/uploads/avatars/文件名.jpg
```

如果能看到图片，说明后端配置正确。

### 步骤 5：检查前端控制台
打开浏览器开发者工具（F12）→ Console 标签，查看是否有错误信息。

### 步骤 6：检查网络请求
打开浏览器开发者工具（F12）→ Network 标签：
1. 勾选 "Preserve log"
2. 上传一张图片
3. 查看图片请求的详细信息

## 快速修复脚本

创建一个测试脚本来验证图片功能：

**文件：** `test/backend/test-image-upload.js`

```javascript
const fs = require('fs');
const path = require('path');

// 创建上传目录
const dirs = [
  'uploads',
  'uploads/avatars',
  'uploads/covers',
  'uploads/gallery'
];

dirs.forEach(dir => {
  const dirPath = path.join(__dirname, dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log('✅ 创建目录:', dir);
  } else {
    console.log('✓ 目录已存在:', dir);
  }
});

console.log('\n所有上传目录已准备就绪！');
```

运行：
```bash
cd test/backend
node test-image-upload.js
```

## 常见错误和解决方案

### 错误 1: "Failed to fetch"
**原因：** 后端未运行或端口不对
**解决：** 启动后端服务 `npm start`

### 错误 2: "404 Not Found"
**原因：** 图片文件不存在或路径错误
**解决：** 检查 `uploads/` 目录和文件权限

### 错误 3: "CORS error"
**原因：** 跨域配置问题
**解决：** 检查后端 CORS 配置

### 错误 4: 图片显示为占位符
**原因：** `getImageUrl()` 返回 undefined 或错误的 URL
**解决：** 在浏览器控制台运行：
```javascript
// 检查 BACKEND_URL
console.log('DEV:', import.meta.env.DEV)
console.log('BACKEND_URL:', import.meta.env.VITE_BACKEND_URL)
```

## 联系支持

如果以上方法都无法解决问题，请提供以下信息：
1. 浏览器控制台的错误信息（Console 标签）
2. 网络请求的详细信息（Network 标签）
3. 后端日志输出
4. 上传目录的文件列表

