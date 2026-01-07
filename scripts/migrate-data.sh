#!/bin/bash
# 数据迁移脚本 - 将本地 PostgreSQL 数据迁移到 Docker

set -e

echo "=== 百合文学档案馆 - 数据迁移脚本 ==="

# 配置
LOCAL_DB_URL="postgresql://postgres:079825lbh@localhost:5432/blog"
DOCKER_CONTAINER="baihe-postgres"
DOCKER_DB="baihe"
DOCKER_USER="postgres"
DOCKER_PASSWORD="postgres123"

BACKUP_FILE="backup_$(date +%Y%m%d_%H%M%S).sql"

echo ""
echo "步骤 1: 导出本地数据库..."
echo "请确保本地 PostgreSQL 服务正在运行"
echo ""

# 导出本地数据库
PGPASSWORD=079825lbh pg_dump -h localhost -U postgres -d blog -F p -f "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    echo "✓ 数据库导出成功: $BACKUP_FILE"
else
    echo "✗ 数据库导出失败"
    exit 1
fi

echo ""
echo "步骤 2: 等待 Docker 容器启动..."
echo ""

# 等待容器就绪
until docker exec $DOCKER_CONTAINER pg_isready -U $DOCKER_USER 2>/dev/null; do
    echo "等待 PostgreSQL 容器就绪..."
    sleep 2
done

echo "✓ PostgreSQL 容器已就绪"

echo ""
echo "步骤 3: 导入数据到 Docker..."
echo ""

# 将备份文件复制到容器
docker cp "$BACKUP_FILE" $DOCKER_CONTAINER:/tmp/backup.sql

# 在容器中执行导入
docker exec -e PGPASSWORD=$DOCKER_PASSWORD $DOCKER_CONTAINER psql -U $DOCKER_USER -d $DOCKER_DB -f /tmp/backup.sql

if [ $? -eq 0 ]; then
    echo "✓ 数据导入成功"
else
    echo "✗ 数据导入失败"
    exit 1
fi

# 清理容器中的临时文件
docker exec $DOCKER_CONTAINER rm /tmp/backup.sql

echo ""
echo "步骤 4: 迁移上传的文件..."
echo ""

# 获取 uploads volume 的路径或直接复制到容器
if [ -d "test/backend/uploads" ]; then
    docker cp test/backend/uploads/. baihe-backend:/app/uploads/
    echo "✓ 上传文件迁移成功"
else
    echo "! 未找到上传目录，跳过文件迁移"
fi

echo ""
echo "=== 迁移完成 ==="
echo "备份文件保存在: $BACKUP_FILE"
echo ""