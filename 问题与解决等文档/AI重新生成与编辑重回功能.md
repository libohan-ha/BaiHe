# AI 重新生成回复与编辑消息重回功能

## 功能说明

1. **重新生成**：对最新的 AI 回复不满意，点击重新生成按钮，AI 重新回答
2. **编辑重回**：编辑用户消息内容后，删除该消息之后的所有消息，AI 基于新内容重新回复

---

## 一、重新生成回复

### 前端逻辑 (`handleRegenerateMessage`)

```typescript
const handleRegenerateMessage = async (messageId: string) => {
  // 1. 清空该消息内容，显示等待动画
  setMessages(prev => prev.map(msg =>
    msg.id === messageId ? { ...msg, content: '' } : msg
  ))
  setRegeneratingMessageId(messageId)

  // 2. 调用后端 API（返回流式响应）
  const response = await regenerateAssistantMessage(
    conversationId, messageId, apiConfig
  )

  // 3. 流式读取并追加内容
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    // 解析 SSE 数据，追加到 streamingContent
    appendStreamingContent(content)
  }

  // 4. 更新本地消息
  setMessages(prev => prev.map(msg =>
    msg.id === messageId ? { ...msg, content: fullContent } : msg
  ))
}
```

### 后端逻辑

**1. 获取该消息之前的历史** (`getMessagesBeforeId`)

```javascript
// 获取目标消息之前的所有消息（不包括当前消息）
const messages = await prisma.chatMessage.findMany({
  where: {
    conversationId,
    createdAt: { lt: targetMessage.createdAt }  // 小于目标消息的创建时间
  },
  orderBy: { createdAt: 'asc' }
})
```

**2. 调用 AI API 重新生成**

- 用历史消息 + system prompt 调用 AI
- 返回流式响应给前端

**3. 更新消息内容** (`updateMessageContent`)

```javascript
await prisma.chatMessage.update({
  where: { id: messageId },
  data: { content: newContent }
})
```

### 流程图

```
点击重新生成
    ↓
清空消息内容，显示 typing 动画
    ↓
后端获取该消息之前的历史
    ↓
调用 AI API（流式）
    ↓
前端实时显示流式内容
    ↓
完成后更新消息内容到数据库
```

---

## 二、编辑消息重回

### 前端逻辑 (`handleSubmitEditMessage`)

```typescript
const handleSubmitEditMessage = async () => {
  // 1. 找到编辑的消息位置，截断后面的消息
  const messageIndex = messages.findIndex(m => m.id === messageId)
  const truncatedMessages = messages.slice(0, messageIndex + 1).map(m =>
    m.id === messageId ? { ...m, content: newContent } : m
  )
  setMessages(truncatedMessages)

  // 2. 调用后端 API
  const response = await editAndRegenerateMessage(
    conversationId, messageId, newContent, apiConfig
  )

  // 3. 流式读取 AI 回复
  // ...同上

  // 4. 重新加载完整消息列表
  const msgs = await getChatMessages(conversationId)
  setMessages(msgs)
}
```

### 后端逻辑 (`editMessageAndTruncate`)

```javascript
const editMessageAndTruncate = async (messageId, newContent, userId) => {
  // 1. 验证权限：只能编辑用户消息
  if (message.role !== 'user') {
    throw createError(400, '只能编辑用户消息')
  }

  // 2. 删除该消息之后的所有消息
  await prisma.chatMessage.deleteMany({
    where: {
      conversationId,
      createdAt: { gt: message.createdAt }  // 大于该消息的创建时间
    }
  })

  // 3. 更新当前消息的内容
  await prisma.chatMessage.update({
    where: { id: messageId },
    data: { content: newContent }
  })

  // 4. 返回剩余消息列表
  return { messages: remainingMessages, character }
}
```

### 流程图

```
编辑用户消息 → 提交
    ↓
前端截断消息列表（乐观更新）
    ↓
后端删除该消息之后的所有消息
    ↓
后端更新该消息内容
    ↓
调用 AI API 生成新回复（流式）
    ↓
保存 AI 回复到数据库
    ↓
前端重新加载消息列表
```

---

## 三、对比

| 功能 | 重新生成 | 编辑重回 |
|------|---------|---------|
| 触发方式 | 点击 AI 消息的重新生成按钮 | 编辑用户消息后提交 |
| 操作对象 | AI 消息（assistant） | 用户消息（user） |
| 历史处理 | 保留所有历史，只替换当前 AI 回复 | 删除该消息之后的所有消息 |
| 数据库操作 | UPDATE 单条消息 | DELETE 后续消息 + UPDATE 当前消息 |
| 前端更新 | 原地更新消息内容 | 重新加载整个消息列表 |

---

## 四、关键代码位置

| 模块 | 文件 | 函数 |
|------|------|------|
| 前端-重新生成 | `AIChatRoomPage/index.tsx` | `handleRegenerateMessage` |
| 前端-编辑重回 | `AIChatRoomPage/index.tsx` | `handleSubmitEditMessage` |
| 后端-获取历史 | `aiChat.service.js` | `getMessagesBeforeId` |
| 后端-更新消息 | `aiChat.service.js` | `updateMessageContent` |
| 后端-编辑截断 | `aiChat.service.js` | `editMessageAndTruncate` |
