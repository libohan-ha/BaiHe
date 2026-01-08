# 图片显示问题排查指南

## 问题描述

在本地开发、Docker 部署、局域网访问等不同环境下，图片有时无法正常显示。

## 已知问题

### 2026-01-08 诊断结果

**问题**: 部分文章封面图片无法显示

**根本原因**: 数据库中引用的图片文件在服务器上不存在

**具体情况**:

- 数据库中存储了封面 URL，但对应的文件已丢失
- 可能原因：文件在迁移、重建容器或其他操作时丢失

**受影响的文章**:
| 文章标题 | coverUrl | 状态 |
|---------|----------|------|
| 在你看得见的地方，我终于能站在你身边 | /uploads/covers/...\_iolbh3ha.jpg | 文件缺失 |
| 买下你的一百个下午 | /uploads/covers/...\_gb5t52xr.jpg | 文件缺失 |
| 同居后的 24 小时 | /uploads/covers/...\_dcom8p70.jpg | 文件缺失 |

**解决方案**: 需要重新上传这些文章的封面图片

---

## 图片系统架构

### 图片存储路径

```
test/backend/uploads/
├── avatars/      # 用户头像
├── covers/       # 文章封面
├── gallery/      # 图库图片
├── chat/         # 聊天图片
└── private/      # 隐私图片
```

### 图片 URL 格式

上传后的图片 URL 格式为相对路径：

- `/uploads/avatars/xxx.jpg`
- `/uploads/covers/xxx.jpg`
- `/uploads/gallery/xxx.jpg`
- `/uploads/chat/xxx.jpg`

### 不同环境的图片访问方式

| 环境        | 前端地址                | 图片代理方式                |
| ----------- | ----------------------- | --------------------------- |
| 本地开发    | http://localhost:5173   | Vite proxy → localhost:3000 |
| Docker 部署 | http://localhost:3004   | Nginx → backend:3000        |
| 局域网访问  | http://192.168.x.x:3004 | Nginx → backend:3000        |

---

## 常见问题及解决方案

### 问题 1: 图片文件不存在

**症状**: 控制台显示 404 错误

**排查步骤**:

```bash
# 1. 检查图片文件是否存在
ls -la test/backend/uploads/gallery/

# 2. 如果是Docker环境，进入容器检查
docker exec -it baihe-backend ls -la /app/uploads/gallery/

# 3. 检查数据库中的图片URL
docker exec -it baihe-backend npx prisma studio
```

**解决方案**:

- 确认图片文件已正确上传到 `test/backend/uploads/` 目录
- Docker 环境下，确保数据卷正确挂载

---

### 问题 2: Docker 数据卷挂载问题

**症状**: 本地有图片文件，但 Docker 容器内找不到

**排查步骤**:

```bash
# 检查docker-compose.yml中的volumes配置
cat docker-compose.yml | grep -A5 volumes

# 检查容器内的uploads目录
docker exec -it baihe-backend ls -la /app/uploads/
```

**解决方案**:

确保 `docker-compose.yml` 中配置正确：

```yaml
backend:
  volumes:
    # 同步本地uploads目录，让本地和Docker共享上传文件
    - ./test/backend/uploads:/app/uploads
```

如果目录权限有问题：

```bash
# Windows/Linux 设置目录权限
chmod -R 755 test/backend/uploads/

# 重新启动容器
docker-compose down
docker-compose up -d
```

---

### 问题 3: Nginx 反向代理配置问题

**症状**: API 请求正常，但图片无法加载

**排查步骤**:

```bash
# 检查Nginx配置
cat yuri-archive/nginx.conf

# 检查Nginx日志
docker logs baihe-frontend

# 测试图片URL
curl -I http://localhost:3004/uploads/gallery/test.jpg
```

**解决方案**:

确保 `nginx.conf` 包含正确的 uploads 代理配置：

```nginx
# 静态文件代理到后端 - 必须在通用规则之前
location /uploads/ {
    set $backend http://backend:3000;
    proxy_pass $backend;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
}
```

---

### 问题 4: 局域网访问图片失败

**症状**: 本机可以看到图片，但局域网其他设备无法显示

**可能原因**:

1. 图片 URL 使用了 `localhost` 或 `127.0.0.1`
2. 防火墙阻止了端口访问
3. 跨域问题

**排查步骤**:

```bash
# 1. 检查前端代码中的BASE_URL配置
cat yuri-archive/src/services/api.ts | grep BASE_URL

# 2. 检查防火墙规则（Windows）
netsh advfirewall firewall show rule name=all | findstr 3004

# 3. 测试从其他设备访问
curl http://192.168.x.x:3004/uploads/gallery/test.jpg
```

**解决方案**:

1. 确保前端使用相对路径（当前代码已正确配置）：

```typescript
// yuri-archive/src/services/api.ts
export function getImageUrl(
  url: string | undefined | null
): string | undefined {
  if (!url) return undefined;

  // 如果已经是完整URL，直接返回
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }

  // 相对路径直接返回，让 Vite proxy 或 Nginx 处理
  if (url.startsWith("/")) {
    return url;
  }

  return url;
}
```

2. 开放防火墙端口：

```bash
# Windows - 开放端口
netsh advfirewall firewall add rule name="BaiHe Frontend" dir=in action=allow protocol=TCP localport=3004
```

---

### 问题 5: 数据库中的旧格式 URL

**症状**: 部分图片可以显示，部分不行

**可能原因**: 历史数据中存储了完整 URL 而非相对路径

**排查步骤**:

```sql
-- 连接数据库检查
SELECT id, "coverUrl" FROM "Article" WHERE "coverUrl" NOT LIKE '/uploads/%' LIMIT 10;
SELECT id, "imageUrl" FROM "Image" WHERE "imageUrl" NOT LIKE '/uploads/%' LIMIT 10;
```

**解决方案**:

修复数据库中的旧 URL：

```sql
-- 修复文章封面URL（示例）
UPDATE "Article"
SET "coverUrl" = REPLACE("coverUrl", 'http://localhost:3000', '')
WHERE "coverUrl" LIKE 'http://localhost:3000%';

-- 修复图片URL
UPDATE "Image"
SET "imageUrl" = REPLACE("imageUrl", 'http://localhost:3000', '')
WHERE "imageUrl" LIKE 'http://localhost:3000%';
```

---

### 问题 6: 后端静态文件服务配置

**症状**: 后端直接访问图片返回 404

**排查步骤**:

```bash
# 直接访问后端测试
curl -I http://localhost:3000/uploads/gallery/test.jpg
```

**解决方案**:

确保后端 `app.js` 正确配置了静态文件服务：

```javascript
// test/backend/src/app.js
const express = require("express");
const path = require("path");
const app = express();

// 静态文件服务 - 重要！必须配置
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));
```

---

## 快速诊断命令

```bash
# 1. 检查所有容器状态
docker-compose ps

# 2. 检查后端日志
docker logs baihe-backend --tail 50

# 3. 检查前端Nginx日志
docker logs baihe-frontend --tail 50

# 4. 检查uploads目录内容
docker exec baihe-backend ls -la /app/uploads/

# 5. 测试API是否正常
curl http://localhost:3004/api/articles

# 6. 测试图片是否可访问
curl -I http://localhost:3004/uploads/gallery/[filename].jpg
```

---

## 完整重建步骤

如果以上方法都无法解决，尝试完整重建：

```bash
# 1. 停止并删除容器
docker-compose down

# 2. 删除旧镜像
docker-compose rm -f
docker image prune -f

# 3. 重新构建
docker-compose build --no-cache

# 4. 启动服务
docker-compose up -d

# 5. 检查状态
docker-compose ps
docker-compose logs -f
```

---

## 预防措施

1. **统一使用相对路径**: 上传图片后始终存储相对路径 `/uploads/xxx/filename.jpg`
2. **正确配置数据卷**: 确保 Docker 数据卷挂载到正确位置
3. **定期备份**: 定期备份 uploads 目录和数据库
4. **使用健康检查**: 添加 Docker 健康检查确保服务正常

---

## 技术支持

如果问题仍未解决，请提供以下信息：

1. 问题截图（浏览器控制台 Network 标签）
2. 图片 URL 的完整路径
3. 运行环境（本地开发/Docker/局域网）
4. `docker-compose ps` 输出
5. 相关日志信息
