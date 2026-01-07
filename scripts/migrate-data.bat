@echo off
chcp 65001 >nul
REM 数据迁移脚本 - 将本地 PostgreSQL 数据迁移到 Docker (Windows)

echo === 百合文学档案馆 - 数据迁移脚本 ===
echo.

REM 配置
set LOCAL_DB=blog
set LOCAL_USER=postgres
set LOCAL_PASSWORD=079825lbh
set LOCAL_HOST=localhost
set LOCAL_PORT=5432

set DOCKER_CONTAINER=baihe-postgres
set DOCKER_DB=baihe
set DOCKER_USER=postgres
set DOCKER_PASSWORD=postgres123

for /f "tokens=2-4 delims=/ " %%a in ('date /t') do (set mydate=%%c%%a%%b)
for /f "tokens=1-2 delims=/:" %%a in ('time /t') do (set mytime=%%a%%b)
set BACKUP_FILE=backup_%mydate%_%mytime%.sql

echo 步骤 1: 导出本地数据库...
echo 请确保本地 PostgreSQL 服务正在运行
echo.

REM 设置 PostgreSQL 密码环境变量
set PGPASSWORD=%LOCAL_PASSWORD%

REM 导出本地数据库（只导出数据，不导出结构）
pg_dump -h %LOCAL_HOST% -U %LOCAL_USER% -d %LOCAL_DB% --data-only --disable-triggers -F p -f "%BACKUP_FILE%"

if %ERRORLEVEL% EQU 0 (
    echo [OK] 数据库导出成功: %BACKUP_FILE%
) else (
    echo [FAIL] 数据库导出失败
    exit /b 1
)

echo.
echo 步骤 2: 等待 Docker 容器启动...
echo.

:wait_loop
docker exec %DOCKER_CONTAINER% pg_isready -U %DOCKER_USER% >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo 等待 PostgreSQL 容器就绪...
    timeout /t 2 >nul
    goto wait_loop
)

echo [OK] PostgreSQL 容器已就绪

echo.
echo 步骤 3: 清空 Docker 数据库中的现有数据...
echo.

REM 清空所有表的数据（保留结构）
docker exec -e PGPASSWORD=%DOCKER_PASSWORD% %DOCKER_CONTAINER% psql -U %DOCKER_USER% -d %DOCKER_DB% -c "TRUNCATE TABLE \"ChatMessage\", \"Conversation\", \"AICharacter\", \"Comment\", \"Collection\", \"ImageCollection\", \"Image\", \"ImageTag\", \"_ImageToImageTag\", \"Article\", \"Tag\", \"_ArticleToTag\", \"User\" CASCADE;"

echo [OK] 数据已清空

echo.
echo 步骤 4: 导入数据到 Docker...
echo.

REM 将备份文件复制到容器
docker cp "%BACKUP_FILE%" %DOCKER_CONTAINER%:/tmp/backup.sql

REM 在容器中执行导入
docker exec -e PGPASSWORD=%DOCKER_PASSWORD% %DOCKER_CONTAINER% psql -U %DOCKER_USER% -d %DOCKER_DB% -f /tmp/backup.sql

if %ERRORLEVEL% EQU 0 (
    echo [OK] 数据导入成功
) else (
    echo [WARN] 数据导入可能有警告，请检查上方输出
)

REM 清理容器中的临时文件
docker exec %DOCKER_CONTAINER% rm /tmp/backup.sql

echo.
echo 步骤 5: 迁移上传的文件...
echo.

if exist "test\backend\uploads" (
    docker cp test\backend\uploads\. baihe-backend:/app/uploads/
    echo [OK] 上传文件迁移成功
) else (
    echo [INFO] 未找到上传目录，跳过文件迁移
)

echo.
echo === 迁移完成 ===
echo 备份文件保存在: %BACKUP_FILE%
echo.

pause