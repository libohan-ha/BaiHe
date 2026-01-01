# 生产环境图片无法显示 - 快速修复指南

## 问题原因

生产环境中，前端请求图片路径为 `/uploads/avatars/xxx.jpg`，但 Nginx 没有配置 `/uploads/` 的反向代理，导致图片无法加载。

## 解决方案

### 方案 1：修改现有 Nginx 配置（推荐）

在你的 Nginx 配置文件中添加 `/uploads/` 的反向代理配置。

**步骤：**

1. **编辑 Nginx 配置文件**
   ```bash
   sudo nano /etc/nginx/sites-available/yuri-archive
   # 或
   sudo nano /etc/nginx/conf.d/yuri-archive.conf
   ```

2. **在 `location /api/` 配置后面添加以下内容：**
   ```nginx
   # 静态资源（图片上传等）反向代理到后端 - 重要！
   location /uploads/ {
       proxy_pass http://127.0.0.1:3000/uploads/;
       proxy_http_version 1.1;
       proxy_set_header Host $host;
       proxy_set_header X-Real-IP $remote_addr;
       proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
       proxy_set_header X-Forwarded-Proto $scheme;
       
       # 图片缓存设置（30天）
       proxy_cache_valid 200 30d;
       expires 30d;
       add_header Cache-Control "public, immutable";
   }
   ```

3. **测试配置**
   ```bash
   sudo nginx -t
   ```

4. **重启 Nginx**
   ```bash
   sudo systemctl restart nginx
   # 或
   sudo service nginx restart
   ```

5. **验证修复**
   - 刷新浏览器页面（Ctrl+F5 强制刷新）
   - 检查图片是否正常显示
   - 打开浏览器开发者工具（F12）→ Network，查看 `/uploads/` 请求是否返回 200

---

### 方案 2：使用提供的完整配置文件

项目中已提供完整的 Nginx 配置文件：`yuri-archive/nginx.conf`

**步骤：**

1. **备份现有配置**
   ```bash
   sudo cp /etc/nginx/sites-available/yuri-archive /etc/nginx/sites-available/yuri-archive.backup
   ```

2. **上传新配置文件到服务器**
   ```bash
   # 在本地执行
   scp yuri-archive/nginx.conf user@your-server:/tmp/yuri-archive.conf
   ```

3. **修改配置文件中的路径**
   ```bash
   # 在服务器上执行
   sudo nano /tmp/yuri-archive.conf
   
   # 修改以下内容：
   # - server_name: 改为你的域名或IP
   # - root: 改为你的前端部署路径
   ```

4. **替换配置文件**
   ```bash
   sudo mv /tmp/yuri-archive.conf /etc/nginx/sites-available/yuri-archive
   ```

5. **测试并重启**
   ```bash
   sudo nginx -t
   sudo systemctl restart nginx
   ```

---

## 验证步骤

### 1. 检查 Nginx 配置是否生效

```bash
# 查看 Nginx 配置
sudo nginx -T | grep -A 10 "location /uploads"
```

应该能看到 `/uploads/` 的配置。

### 2. 测试图片访问

在浏览器中直接访问一个图片URL（替换为实际的图片路径）：
```
http://your-domain.com/uploads/avatars/xxx.jpg
```

如果能看到图片，说明配置成功。

### 3. 检查后端是否运行

```bash
curl http://127.0.0.1:3000/api/health
```

应该返回：
```json
{"status":"ok","timestamp":"..."}
```

### 4. 检查上传目录权限

```bash
ls -la /path/to/backend/uploads/
```

确保目录存在且有读取权限。

---

## 常见问题

### Q1: 修改配置后图片还是不显示

**A:** 清除浏览器缓存并强制刷新（Ctrl+Shift+R 或 Cmd+Shift+R）

### Q2: Nginx 配置测试失败

**A:** 检查配置文件语法，确保每个 `location` 块都有正确的花括号

### Q3: 图片返回 404

**A:** 检查：
1. 后端是否运行在 127.0.0.1:3000
2. 后端 `uploads/` 目录是否存在
3. 图片文件是否真实存在

### Q4: 图片返回 502 Bad Gateway

**A:** 后端服务未运行，启动后端：
```bash
cd /path/to/backend
npm start
# 或使用 PM2
pm2 start src/app.js --name yuri-backend
```

---

## 完整的 Nginx 配置示例

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/yuri-archive;
    index index.html;

    # 前端路由
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API 代理
    location /api/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # 图片代理（重要！）
    location /uploads/ {
        proxy_pass http://127.0.0.1:3000/uploads/;
        proxy_set_header Host $host;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

---

## 需要帮助？

如果以上方法都无法解决问题，请提供：

1. **Nginx 错误日志**
   ```bash
   sudo tail -f /var/log/nginx/error.log
   ```

2. **浏览器控制台错误**
   - 打开 F12 → Console 标签
   - 截图错误信息

3. **网络请求详情**
   - 打开 F12 → Network 标签
   - 找到失败的图片请求
   - 查看 Request URL 和 Status Code

