# 百合文学档案馆 - Docker 部署指南

## 目录结构

```
BaiHe-main/
├── docker-compose.yml          # Docker 编排配置
├── scripts/
│   ├── migrate-data.sh         # Linux/Mac 数据迁移脚本
│   └── migrate-data.bat        # Windows 数据迁移脚本
├── test/backend/
│   ├── Dockerfile              # 后端 Docker 配置
│   └── .dockerignore
└── yuri-archive/
    ├── Dockerfile              # 前端 Docker 配置
    ├── nginx.conf              # Nginx 配置
    └── .dockerignore
```

## 快速部署

### 1. 首次部署（无数据迁移）

```bash
# 构建并启动所有服务
docker-compose up -d --build

# 查看运行状态
docker-compose ps

# 查看日志
docker-compose logs -f
```

启动后访问：http://localhost:3005

### 2. 带数据迁移的部署

#### 步骤 1：启动 Docker 容器

```bash
docker-compose up -d --build
```

#### 步骤 2：迁移现有数据

**Windows:**

```cmd
scripts\migrate-data.bat
```

**Linux/Mac:**

```bash
chmod +x scripts/migrate-data.sh
./scripts/migrate-data.sh
```

## 服务说明

| 服务   | 容器名         | 端口    | 说明               |
| ------ | -------------- | ------- | ------------------ |
| 前端   | baihe-frontend | 3005:80 | React 应用 + Nginx |
| 后端   | baihe-backend  | -       | Node.js API 服务   |
| 数据库 | baihe-postgres | -       | PostgreSQL 15      |

> 注：后端和数据库服务仅在 Docker 网络内部可访问，不对外暴露端口

## 常用命令

### 启动服务

```bash
docker-compose up -d
```

### 停止服务

```bash
docker-compose down
```

### 重新构建

```bash
docker-compose up -d --build
```

### 查看日志

```bash
# 所有服务
docker-compose logs -f

# 指定服务
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
```

### 进入容器

```bash
# 进入后端容器
docker exec -it baihe-backend sh

# 进入数据库容器
docker exec -it baihe-postgres psql -U postgres -d baihe
```

### 数据备份

```bash
# 备份数据库
docker exec baihe-postgres pg_dump -U postgres baihe > backup.sql

# 备份上传文件
docker cp baihe-backend:/app/uploads ./uploads_backup
```

### 数据恢复

```bash
# 恢复数据库
docker cp backup.sql baihe-postgres:/tmp/
docker exec baihe-postgres psql -U postgres -d baihe -f /tmp/backup.sql

# 恢复上传文件
docker cp ./uploads_backup/. baihe-backend:/app/uploads/
```

## 配置修改

### 修改端口

编辑 `docker-compose.yml`，修改 frontend 服务的 ports：

```yaml
frontend:
  ports:
    - "3005:80" # 修改 3005 为你想要的端口
```

### 修改数据库密码

编辑 `docker-compose.yml`，修改以下位置：

```yaml
postgres:
  environment:
    POSTGRES_PASSWORD: your_new_password

backend:
  environment:
    DATABASE_URL: postgresql://postgres:your_new_password@postgres:5432/baihe?schema=public
```

### 修改 JWT 密钥

编辑 `docker-compose.yml`：

```yaml
backend:
  environment:
    JWT_SECRET: your-super-secret-jwt-key-change-this-in-production
```

## 数据持久化

数据存储在 Docker volumes 中：

- `postgres_data`: PostgreSQL 数据库文件
- `uploads_data`: 用户上传的文件

查看 volumes：

```bash
docker volume ls
```

## 故障排除

### 1. 端口被占用

```bash
# 检查端口占用
netstat -ano | findstr :3005

# 或修改 docker-compose.yml 中的端口
```

### 2. 数据库连接失败

```bash
# 检查数据库容器状态
docker-compose ps
docker-compose logs postgres

# 重启数据库
docker-compose restart postgres
```

### 3. 前端访问后端 API 失败

检查 nginx.conf 中的代理配置是否正确，确保 `proxy_pass http://backend:3000` 与后端服务名匹配。

### 4. 构建失败

```bash
# 清理缓存重新构建
docker-compose build --no-cache
docker-compose up -d
```

## 生产环境建议

1. **修改默认密码**：更改 PostgreSQL 和 JWT 的默认密码
2. **启用 HTTPS**：配置 SSL 证书
3. **定期备份**：设置自动备份脚本
4. **资源限制**：在 docker-compose.yml 中添加内存和 CPU 限制
5. **日志管理**：配置日志轮转，避免日志文件过大

## 更新部署

```bash
# 拉取最新代码后
git pull

# 重新构建并启动
docker-compose up -d --build
```
