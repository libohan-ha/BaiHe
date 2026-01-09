# AI 回复后等待气泡停留问题

## 问题描述

点击 AI 重新回复按钮后，AI 输出完毕，等待动画（三个跳动的点）仍然停留在页面上，没有消失。

## 问题原因

`handleRegenerateMessage` 函数中存在两个状态清理问题：

### 1. `sending` 状态未清除

```tsx
// useEffect 在 isStreaming=true 时自动设置 sending=true
useEffect(() => {
  if (isStreaming && streamingConversationId === currentConversation?.id) {
    setSending(true)
  }
}, [isStreaming])
```

流式完成后，`isStreaming` 被重置为 false，但 `sending` 没有被清除，仍为 true。

这导致额外等待气泡的渲染条件始终满足：
```tsx
{sending && !streamingMessageId && !regeneratingMessageId && (
  // 显示等待气泡
)}
```

### 2. `regeneratingMessageId` 清除时机晚于 `isStreaming`

`resetStreaming()` 在 try 块中调用，设置 `isStreaming=false`。
`setRegeneratingMessageId(null)` 在 finally 块中调用。

中间状态时，渲染条件 `msg.id === regeneratingMessageId` 仍为 true，继续显示 typing 动画。

## 解决方案

### 修改 1：finally 块中添加 `setSending(false)`

文件：`yuri-archive/src/pages/AIChatRoomPage/index.tsx`
位置：`handleRegenerateMessage` 函数的 finally 块（约第720-724行）

```tsx
} finally {
  setRegeneratingMessageId(null)
  setSending(false)  // 新增
  setStreamingState({ isStreaming: false, conversationId: null, messageId: null })
}
```

### 修改 2：渲染条件添加 `isStreaming` 检查

位置：消息气泡渲染逻辑（约第1083行）

```tsx
// 修改前
) : msg.id === regeneratingMessageId ? (

// 修改后
) : (isStreaming && msg.id === regeneratingMessageId) ? (
```

确保只有在 `isStreaming=true` 时才显示 typing 动画。
