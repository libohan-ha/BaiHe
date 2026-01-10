# AI 聊天发送图片功能

## 功能概述

用户可以在 AI 聊天中发送图片，图片会被发送给 AI（如 Claude/DeepSeek）进行多模态理解。

## 完整流程

```
用户选择图片 → 压缩 → 上传到服务器 → 获取 URL → 发送消息时转 base64 → 发给 AI API
     ↓
保存消息到数据库（存储图片 URL 数组）
```

## 前端实现

### 1. 图片选择与上传 (`AIChatRoomPage/index.tsx`)

```typescript
const handleImageSelect = async (e) => {
  for (const file of files) {
    // 1. 压缩大图片
    const processedFile = await compressImage(file)

    // 2. 上传到服务器
    const result = await uploadChatImage(processedFile)

    // 3. 保存返回的 URL
    setSelectedImages(prev => [...prev, result.url])
  }
}
```

### 2. 发送消息 (`handleSend`)

```typescript
const handleSend = async () => {
  const imagesToSend = [...selectedImages]

  // 1. 保存用户消息到数据库（包含图片 URL 数组）
  const userMsg = await sendChatMessage(conversationId, content, imagesToSend)

  // 2. 构建多模态格式（图片转 base64）发给 AI
  const formattedContent = await formatMessageWithImages(content, imagesToSend)

  // 3. 调用 AI API
  fetch('/api/ai-chat/proxy', {
    body: JSON.stringify({
      messages: [
        ...historyMessages,  // 历史消息不带图片
        { role: 'user', content: formattedContent }  // 当前消息带图片
      ]
    })
  })
}
```

### 3. 图片转 base64 (`api.ts`)

```typescript
// 将图片 URL 转换为 base64（AI API 需要）
async function imageUrlToBase64(imageUrl: string): Promise<string> {
  const response = await fetch(getImageUrl(imageUrl))
  const blob = await response.blob()
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result as string)
    reader.readAsDataURL(blob)
  })
}

// 构建多模态消息格式
async function formatMessageWithImages(content, imageUrls) {
  if (!imageUrls?.length) return content  // 无图片返回纯文本

  const contentParts = []

  // 添加文本
  if (content.trim()) {
    contentParts.push({ type: 'text', text: content })
  }

  // 添加图片（base64 格式）
  for (const url of imageUrls) {
    const base64 = await imageUrlToBase64(url)
    contentParts.push({
      type: 'image_url',
      image_url: { url: base64 }
    })
  }

  return contentParts
}
```

## 后端实现

### 1. 图片上传 (`/api/upload/chat`)

- 使用 Multer 处理文件上传
- 存储到 `uploads/chat/` 目录
- 返回相对 URL：`/uploads/chat/xxx.jpg`

### 2. 消息存储 (`aiChat.service.js`)

```javascript
const addMessage = async (conversationId, content, role, userId, images = []) => {
  const message = await prisma.chatMessage.create({
    data: {
      content,
      role,
      images,  // 直接存储 URL 数组
      conversationId
    }
  })
}
```

### 3. 数据库 Schema (`schema.prisma`)

```prisma
model ChatMessage {
  id             String   @id @default(cuid())
  content        String   @db.Text
  role           String   // 'user' 或 'assistant'
  images         String[] // 图片 URL 数组
  conversationId String
  createdAt      DateTime @default(now())
}
```

## 数据流向

| 阶段 | 存储位置 | 格式 |
|------|---------|------|
| 上传 | 服务器磁盘 `uploads/chat/` | 原始文件 |
| 数据库 | ChatMessage.images | URL 数组 `["/uploads/chat/xxx.jpg"]` |
| 发给 AI | 请求体 | base64 `data:image/jpeg;base64,...` |
| 显示 | 前端渲染 | `<img src="/uploads/chat/xxx.jpg">` |

## 关键设计

| 设计点 | 说明 |
|--------|------|
| 分离存储 | 文件存磁盘，URL 存数据库 |
| 按需转换 | 只在发给 AI 时转 base64，存储用 URL |
| 历史消息不带图 | 只有最新消息传图片，减少 token 消耗 |
| 支持多图 | `images` 是数组，支持一次发多张 |
| 支持粘贴 | `handlePaste` 处理剪贴板图片 |
