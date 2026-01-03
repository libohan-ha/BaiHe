FROM node:20-alpine

WORKDIR /app

# 安装 OpenSSL（Prisma 需要）
RUN apk add --no-cache openssl

# 复制 package.json
COPY package*.json ./

# 安装依赖
RUN npm ci --only=production

# 复制 Prisma schema
COPY prisma ./prisma/

# 生成 Prisma Client
RUN npx prisma generate

# 复制源代码
COPY src ./src/

# 创建上传目录
RUN mkdir -p uploads/avatars uploads/covers uploads/gallery uploads/chat

# 暴露端口
EXPOSE 3000

# 启动命令
CMD ["node", "src/app.js"]