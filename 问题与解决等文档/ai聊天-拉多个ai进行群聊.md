ai 聊天路由中，加个功能：可以多个 ai 进行群聊的功能。

直接使用用户的自己建立的 ai 角色吧，用户可以@自己创建的 ai 角色（用建立好的头像、提示词，这部分已经建立好了，你可以找下逻辑）

用户输入 @ 后，是弹出一个 AI 列表让用户选择，还是直接输入 AI 名称（如 @小助手 你好）都可以。

带上之前 100 条数据吧作为上下文。是所用人的聊天记录 100 条

流式输出（打字机效果） 这部分也有逻辑，可以找下。
排队处理

头像和名称即用户自己在 ai 聊天中配置的 ai
不同 AI 可以同时回复

多个 ai 先用等待特效占位，然后流式打字

显示 AI 头像 + "..." 的气泡 这个逻辑你可以找下，项目中有等待特效的实现

同时显示等待占位，各自流式输出

1.  场景定位

- 这个功能是在现有的 AIChatRoomPage（与单个 AI 的私聊页面）中增加 @其他 AI 的能力？
- 还是需要新建一个页面专门做多 AI 群聊？

2. 数据模型

现有的 Conversation 是绑定到单个 AICharacter 的：
Conversation → characterId → 一个 AI 角色
如果要支持多 AI 群聊：

- 方案 A：保持现有结构，在对话中可以 @其他 AI，但对话仍然"归 属"于一个主角色
- 方案 B：新建一种"群聊对话"类型，不绑定单个角色
- 你倾向哪种？

3. 消息归属

当多个 AI 回复时，ChatMessage 表目前只有 role: user | assistant，没有区分是哪个 AI 回复的。需要：

- 添加 aiCharacterId 字段来标识是哪个 AI 的回复？
- 还是用其他方式区分？

4. UI 交互

- 输入 @ 时弹出 AI 列表选择 ✅（参考公共聊天室已有实现）
- 多个 AI 的消息气泡：
  - 是否显示各自的头像和名称？
  - 消息样式是否需要区分（比如不同 AI 用不同颜色边框）？

5. AI 回复时机

- 用户发送消息后，被 @ 的多个 AI 同时开始回复（并行）？
- 还是排队依次回复（串行）？

6. 上下文处理

- 带上之前 100 条消息作为上下文 ✅
- 但这 100 条消息中如果有多个 AI 的回复，每个 AI 调用时：
  - 所有 AI 共享同一个上下文？
  - 还是每个 AI 只看自己之前的回复？

7. API Key 配置

- 不同 AI 可能使用不同的模型（DeepSeek、Claude 等）
- 用户需要提前配置好各模型的 API Key，验证逻辑参考公共聊天 室已有实现？ 1.在现有的 AIChatRoomPage 中新建一个页面做多 ai 群聊

2 方案 A：保持现有结构，在对话中可以 @其他 AI，但对话仍然"归 属"于一个主角色

3.添加 aiCharacterId 字段来标识

4 是，不用

5.同时开始回复（并行）

6 所有 AI 共享同一个上下文

7 是的

8/ai-group-chat/:characterId

9 在 AI 角色列表页面加一个"群聊"入口

10A. 共用：用户可以在单聊和群聊之间切换，历史消息保留

11 要不这样吧，用户点击群聊后可以拉 ai 角色，拉进来的进行聊天。先取消@功能

12C. 两者都有（入口时选+页面内可继续添加/移除）

13 中途添加新的 AI
中途移除某个 AI

14 A. 保存：下次打开群聊，之前拉入的 AI 还在

15A. 所有群内的 AI 都会回复 暂时先这样

16 只是作为"对话归属"标识

17B. 新建一个关联表 ConversationMember（conversationId + aiCharacterId）

18A. 添加一个 isGroupChat 布尔字段

19B. 按固定顺序（比如按群成员列表顺序），可以接受
所有 ai 回复的时候出现一个等待特效就行了，可以复用逻辑

20 A. 显示错误提示，其他 AI 继续正常回复

📋 多 AI 群聊功能 - 完整设计方案

一、功能概述

在 AI 聊天模块中新增"群聊"功能，用户可以创建一个群 聊对话，拉入多个自己创建的 AI 角色，发送消息后所有 AI 并行回复。

---

二、数据库设计

1. 修改 Conversation 表

model Conversation {
id String @id @default(cuid())
title String @default("新对话")  
 characterId String // 主角色（对话归属标识）
character AICharacter @relation(fields: [characterId], references: [id], onDelete: Cascade)  
 userId String
user User @relation(fields: [userId], references: [id], onDelete: Cascade)
isGroupChat Boolean @default(false) // 🆕 是否为群聊
messages ChatMessage[]
members ConversationMember[] // 🆕 群聊成员
createdAt DateTime @default(now())  
 updatedAt DateTime @updatedAt
}

2. 新建 ConversationMember 表

model ConversationMember {
id String @id @default(cuid())
conversationId String
conversation Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
aiCharacterId String
aiCharacter AICharacter @relation(fields: [aiCharacterId], references: [id], onDelete: Cascade)
order Int @default(0) // 成员顺序（用于回复排序）
createdAt DateTime @default(now())

    @@unique([conversationId, aiCharacterId])     // 同一对话不能重复添加同一AI
    @@index([conversationId])
    @@index([aiCharacterId])

}

3. 修改 ChatMessage 表

model ChatMessage {
id String @id @default(cuid())
content String @db.Text
role String // 'user' 或 'assistant'
images String[]
aiCharacterId String? // 🆕 AI 角色 ID（群聊 时标识是哪个 AI 的回复）
aiCharacter AICharacter? @relation(fields: [aiCharacterId], references: [id], onDelete: SetNull)  
 conversationId String
conversation Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)  
 createdAt DateTime @default(now())  
 }

4. 修改 AICharacter 表（添加关联）

model AICharacter {
// ... 现有字段 ...
conversationMembers ConversationMember[] // 🆕 参与的群聊
chatMessages ChatMessage[] // 🆕 发送的消息
}

---

三、API 设计

1. 群聊对话管理
   方法: POST
   路由: /api/ai-chat/group-conversations
   说明: 创建群聊对话（带初始成员）
   ────────────────────────────────────────
   方法: GET
   路由: /api/ai-chat/group-conversations/:characterId
   说明: 获取主角色的群聊对话列表
   ────────────────────────────────────────
   方法: GET
   路由: /api/ai-chat/group-conversations/:conversationId/members
   说明: 获取群聊成员列表
   ────────────────────────────────────────
   方法: POST
   路由: /api/ai-chat/group-conversations/:conversationId/members
   说明: 添加群聊成员
   ────────────────────────────────────────
   方法: DELETE
   路由: /api/ai-chat/group-conversations/:conversationId/members/:aiCharacterId
   说明: 移除群聊成员
2. 群聊消息
   方法: POST
   路由: /api/ai-chat/group-chat
   说明: 发送群聊消息（触发所有 AI 回复，SSE 流式）

---

四、前端页面设计

1. 新增页面

- 路由: /ai-group-chat/:characterId
- 页面: AIGroupChatPage

2. 页面结构

┌─────────────────────────────────────────┐  
 │ Header: 群聊标题 + 成员头像列表 + 管理按钮 │  
 ├─────────────────────────────────────────┤  
 │ │  
 │ 消息列表区域 │  
 │ - 用户消息（右侧） │  
 │ - AI 消息（左侧，带头像+名称标识） │  
 │ - 等待占位（统一一个 loading 动画） │  
 │ │  
 ├─────────────────────────────────────────┤  
 │ 输入框 + 发送按钮 │  
 └─────────────────────────────────────────┘

3. 入口位置

- AI 角色列表页面（/ai-chat）添加"群聊"入口按钮
- 点击后弹窗选择主角色 + 初始成员，然后进入群聊页面

---

五、核心流程

1. 创建群聊

用户点击"群聊" → 弹窗选择主角色 + 成员 → 创建 Conversation(isGroupChat=true)
→ 创建 ConversationMember 记录 → 跳转到群聊页面

2. 发送消息

用户发送消息 → 保存用户消息到 ChatMessage
→ 获取群聊成员列表（按 order 排序）
→ 获取最近 100 条消息作为上下文
→ 并行调用所有 AI API（每个 AI 独立流式）
→ 前端显示一个统一的等待占位
→ 按成员顺序依次显示各 AI 的流式回复
→ 每个 AI 完成后保存到 ChatMessage（带 aiCharacterId ）

3. 流式输出显示逻辑

用户发送 → 显示一个等待占位（loading 动画）
→ 第一个 AI 开始流式输出，占位消失，显示 AI1 的流式消息
→ AI1 完成，开始显示 AI2 的流式消息
→ ... 依次显示
→ 所有 AI 完成

---

六、复用现有逻辑
功能: 流式输出
复用来源: AIChatRoomPage 的 SSE 处理逻辑
────────────────────────────────────────
功能: 等待占位动画
复用来源: 公共聊天室的 ai:typing 三点跳动效果  
 ────────────────────────────────────────
功能: API 调用
复用来源: publicChatAI.service.js 的 streamAIResponse
────────────────────────────────────────
功能: 上下文格式化
复用来源: formatMessagesForAI 函数

---

七、文件改动清单

后端

1. prisma/schema.prisma - 数据库模型修改
2. src/routes/aiChat.routes.js - 添加群聊相关路由
3. src/controllers/aiChat.controller.js - 添加群聊 控制器方法
4. src/services/aiChat.service.js - 添加群聊业务逻 辑
5. src/services/aiGroupChat.service.js - 🆕 群聊 AI 调用服务

前端

1. src/pages/AIGroupChatPage/ - 🆕 群聊页面
2. src/pages/AIChatPage/ - 添加群聊入口按钮
3. src/components/GroupMemberSelector/ - 🆕 成员选 择弹窗组件
4. src/services/api.ts - 添加群聊相关 API
5. src/App.tsx - 添加路由

---

✅ 确认

问题：
1.ai 群聊的历史记录不应该挂载到单个 ai 的聊天历史中，而是应该挂载到群聊的历史记录，明白吗？可能是数据库没设计对？

2.现在 ai 之间不能接受到其他 ai 的回复
D:\桌面\BaiHe-main\截图-cc\image copy 5.png

3.用户的头像应该放在气泡右边。D:\桌面\BaiHe-main\截图-cc\image copy 4.png

4.我发一句话后，一个 ai 会重复出现一个气泡，回复生成后消失。D:\桌面\BaiHe-main\截图-cc\image copy 4.png

待办：
添加 qwen coder 模型
ai 头像扁了
加个固定聊天框
加个自动聚焦输入框
