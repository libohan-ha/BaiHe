# AI 服务 Docker 与本地版本对比

## 架构概述

```
┌─────────────────────────────────────────────────────────────┐
│                         前端                                 │
│   用户输入 → 调用 /api/ai-chat/proxy → 后端代理转发          │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                      后端 AI 代理                            │
│   接收请求 → fixProxyUrl() → 转发到 AI API → 流式返回       │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    AI API 服务                               │
│   DeepSeek API (https://api.deepseek.com)                   │
│   Claude 代理 (本地 http://127.0.0.1:8045)                  │
└─────────────────────────────────────────────────────────────┘
```

---

## 核心差异对比

| 配置项 | 本地开发 | Docker 部署 |
|--------|---------|-------------|
| 数据库连接 | `localhost:5432` | `host.docker.internal:5432` |
| NODE_ENV | `development` | `production` |
| AI 代理地址转换 | 局域网 IP → `127.0.0.1` | 本地地址 → `host.docker.internal` |
| 上传目录 | `test/backend/uploads/` | 容器内 `/app/uploads`（挂载到宿主机） |

---

## AI 代理 URL 转换逻辑

### 代码实现 (`aiChat.controller.js`)

```javascript
const fixProxyUrl = (url) => {
  const localProxyPorts = ['8045', '8080', '8000']
  const isDocker = process.env.NODE_ENV === 'production'

  if (isDocker) {
    // Docker 环境：本地代理端口转为 host.docker.internal
    // 127.0.0.1:8045 → host.docker.internal:8045
    if ((isLocalhost || isPrivateIP) && localProxyPorts.includes(port)) {
      urlObj.hostname = 'host.docker.internal'
    }
  } else {
    // 本地环境：局域网 IP 转为 127.0.0.1
    // 192.168.1.100:8045 → 127.0.0.1:8045
    if (isPrivateIP && localProxyPorts.includes(port)) {
      urlObj.hostname = '127.0.0.1'
    }
  }
}
```

### 转换示例

| 场景 | 原始 URL | 本地开发 | Docker |
|------|----------|---------|--------|
| Claude 代理 | `http://127.0.0.1:8045/v1` | 不变 | `http://host.docker.internal:8045/v1` |
| 局域网访问 | `http://192.168.1.100:8045/v1` | `http://127.0.0.1:8045/v1` | `http://host.docker.internal:8045/v1` |
| DeepSeek | `https://api.deepseek.com` | 不变 | 不变 |

---

## Docker 配置详解

### docker-compose.yml

```yaml
backend:
  environment:
    # 使用 host.docker.internal 访问宿主机数据库
    DATABASE_URL: postgresql://postgres:xxx@host.docker.internal:5432/blog
    NODE_ENV: production  # 触发 Docker 模式的 URL 转换

  volumes:
    # 文件共享：Docker 和本地使用同一个上传目录
    - ./test/backend/uploads:/app/uploads

  extra_hosts:
    # Linux 系统需要添加此配置以支持 host.docker.internal
    - "host.docker.internal:host-gateway"

  command: sh -c "npx prisma migrate deploy && node src/app.js"
```

### Dockerfile

```dockerfile
# 创建上传目录
RUN mkdir -p uploads/avatars uploads/covers uploads/gallery uploads/chat

# 生成 Prisma Client
RUN npx prisma generate
```

---

## AI 代理工作流程

### 请求流程

```
前端 → POST /api/ai-chat/proxy
       {
         apiUrl: "http://127.0.0.1:8045/v1/chat/completions",
         apiKey: "sk-xxx",
         model: "claude-opus-4-5-thinking",
         messages: [...]
       }
          ↓
后端 proxyAIRequest()
  1. fixProxyUrl(apiUrl) 转换地址
  2. fetch(fixedUrl, { stream: true })
  3. 流式转发响应给前端
          ↓
前端 reader.read() 逐块读取
```

### 流式响应处理

```javascript
// 后端转发流式响应
res.setHeader('Content-Type', 'text/event-stream')
res.setHeader('Cache-Control', 'no-cache')

const reader = response.body.getReader()
while (true) {
  const { done, value } = await reader.read()
  if (done) break
  res.write(chunk)  // 直接转发给前端
}
res.end()
```

---

## 为什么需要后端代理？

| 问题 | 说明 |
|------|------|
| CORS 限制 | 浏览器无法直接请求第三方 API |
| API Key 安全 | 密钥存储在前端 localStorage，但通过后端转发避免暴露 |
| 地址转换 | 处理 Docker/本地环境的网络差异 |
| 统一入口 | 便于日志、限流、错误处理 |

---

## 本地开发 vs Docker 启动

### 本地开发

```bash
cd test/backend
npm run dev
# 使用 .env 中的配置
# DATABASE_URL=localhost:5432
# NODE_ENV=development
```

### Docker 部署

```bash
docker-compose up -d
# 使用 docker-compose.yml 中的环境变量
# DATABASE_URL=host.docker.internal:5432
# NODE_ENV=production
```

---

## 关键设计总结

| 设计点 | 说明 |
|--------|------|
| 环境检测 | 通过 `NODE_ENV=production` 判断是否 Docker |
| 地址转换 | `fixProxyUrl()` 自动处理本地/Docker 网络差异 |
| 文件共享 | Volume 挂载让 Docker 和本地共享上传文件 |
| 流式转发 | 后端直接转发 SSE 流，不缓存 |
