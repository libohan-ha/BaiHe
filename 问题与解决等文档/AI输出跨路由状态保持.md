# AI 输出跨路由状态保持功能

## 功能描述

用户在 AI 聊天页面发送消息后，AI 正在流式输出过程中，切换到其他路由再返回，输出内容和状态不丢失，继续显示。

## 实现原理

**核心思路**：将流式状态存储在全局 Store（Zustand）而非组件内部 useState。

## 实现代码

### 1. Store 定义 (`store/aiChatStore.ts`)

```typescript
// 流式回复状态（跨路由保留）
streamingContent: string           // 已输出的内容
streamingConversationId: string    // 当前对话ID
streamingMessageId: string | null  // 当前消息ID（重新生成时使用）
isStreaming: boolean               // 是否正在流式输出

// 操作方法
appendStreamingContent: (chunk) => set(state => ({
  streamingContent: state.streamingContent + chunk
}))

resetStreaming: () => set({
  streamingContent: '',
  streamingConversationId: null,
  streamingMessageId: null,
  isStreaming: false
})
```

### 2. 组件使用 (`AIChatRoomPage/index.tsx`)

**从 Store 获取状态：**
```typescript
const {
  streamingContent,
  streamingConversationId,
  streamingMessageId,
  isStreaming,
  appendStreamingContent,
  resetStreaming
} = useAIChatStore()
```

**流式输出时追加内容到 Store：**
```typescript
// 收到流式数据时
if (content) {
  appendStreamingContent(content)  // 存到 Store，而非 useState
}
```

**组件重新挂载时恢复状态：**
```typescript
// 跨路由保留流式状态：恢复发送禁用/显示动画
useEffect(() => {
  if (isStreaming && streamingConversationId === currentConversation?.id) {
    setSending(true)  // 恢复 UI 状态
  }
}, [isStreaming])
```

**渲染时使用 Store 中的内容：**
```tsx
{streamingContent ? (
  <>
    {streamingContent}
    <span className={styles.cursor}>|</span>
  </>
) : (
  <div className={styles.typing}>...</div>
)}
```

## 状态流转

```
发送消息
    ↓
setStreamingState({ isStreaming: true, conversationId: xxx })
    ↓
收到流式数据 → appendStreamingContent(chunk) → Store 更新 → UI 渲染
    ↓
用户切换路由 → 组件卸载 → Store 状态保留
    ↓
用户返回 → 组件挂载 → useEffect 检测 isStreaming → 恢复 UI
    ↓
流式完成 → resetStreaming() → 清空状态
```

## 关键点

| 要点 | 说明 |
|------|------|
| 状态存储位置 | Zustand Store（全局），而非 useState（组件内） |
| 内容追加方式 | `appendStreamingContent(chunk)` 累积到 Store |
| 状态恢复时机 | 组件挂载时通过 useEffect 检测 `isStreaming` |
| 对话匹配 | 通过 `streamingConversationId === currentConversation?.id` 确保显示正确对话的内容 |
