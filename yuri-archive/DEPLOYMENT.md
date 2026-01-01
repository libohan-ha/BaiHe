# 部署指南

## 前端部署到 Nginx

### 1. 构建生产版本

```bash
cd yuri-archive
npm run build
```

构建完成后，会在 `dist/` 目录生成静态文件。

### 2. Nginx 配置示例

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # 前端静态文件
    root /path/to/yuri-archive/dist;
    index index.html;

    # 前端路由（SPA）
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API 反向代理到后端
    location /api/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # 静态资源（图片上传等）反向代理到后端 - 重要！
    location /uploads/ {
        proxy_pass http://127.0.0.1:3000/uploads/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # 图片缓存设置
        proxy_cache_valid 200 30d;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### 3. 部署步骤

1. **上传构建文件到服务器**

   ```bash
   scp -r dist/* user@your-server:/path/to/yuri-archive/dist/
   ```

2. **配置 Nginx**

   ```bash
   sudo nano /etc/nginx/sites-available/yuri-archive
   # 粘贴上面的配置，修改 server_name 和 root 路径

   sudo ln -s /etc/nginx/sites-available/yuri-archive /etc/nginx/sites-enabled/
   ```

3. **测试并重启 Nginx**
   ```bash
   sudo nginx -t
   sudo systemctl restart nginx
   ```

### 4. 环境变量配置

项目已配置好环境变量支持：

- **开发环境** (`.env.development`)：自动使用 Vite proxy 代理到 `localhost:3000`
- **生产环境** (`.env.production`)：使用相对路径，通过 Nginx 反向代理

**无需修改任何代码**，构建时会自动使用正确的配置。

### 5. 验证部署

访问 `http://your-domain.com`，检查：

- [ ] 页面正常加载
- [ ] 登录/注册功能正常
- [ ] 文章列表正常显示
- [ ] 图片正常加载
- [ ] 浏览器控制台无 CORS 或 404 错误

## 后端部署

确保后端服务运行在 `127.0.0.1:3000`：

```bash
cd test/backend
npm install
npm start
```

或使用 PM2 守护进程：

```bash
pm2 start src/app.js --name yuri-backend
pm2 save
pm2 startup
```

## 常见问题

### Q: 前端请求后端时出现 404

**A:** 检查 Nginx 配置中的 `proxy_pass` 是否正确指向后端地址 `http://127.0.0.1:3000`

### Q: 图片无法加载

**A:** 确保 Nginx 配置了 `/uploads/` 的反向代理

### Q: 刷新页面出现 404

**A:** 确保 Nginx 配置了 `try_files $uri $uri/ /index.html;` 以支持 SPA 路由

### Q: CORS 错误

**A:** 检查后端 CORS 配置，确保允许你的域名访问
