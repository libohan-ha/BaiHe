# 更新日志

记录项目的功能开发和 Bug 修复历史。

---

## [2025-12-26]

### 新功能

#### 1. 文章评论功能
- **描述**: 实现了完整的文章评论系统，支持发表评论、回复评论、删除评论
- **修改文件**:
  - `yuri-archive/src/components/CommentSection/index.tsx` - 评论区主组件
  - `yuri-archive/src/components/CommentSection/CommentSection.module.css` - 评论区样式
  - `yuri-archive/src/types/index.ts` - 添加 Comment 类型定义
  - `yuri-archive/src/components/index.ts` - 导出 CommentSection 组件
  - `yuri-archive/src/pages/ArticleDetailPage/index.tsx` - 集成评论区
- **功能特点**:
  - 评论列表展示，支持分页
  - 登录用户可发表评论
  - 回复评论功能
  - 评论作者或管理员可删除评论
  - 紫色主题风格

#### 2. 评论嵌套优化（回复 @xxx 功能）
- **描述**: 优化评论显示逻辑，二级以下评论显示 `回复 @用户名：` 前缀
- **修改文件**:
  - `test/backend/src/services/comment.service.js` - 后端添加 replyToUser 字段
  - `yuri-archive/src/components/CommentSection/index.tsx` - 前端显示回复对象
  - `yuri-archive/src/components/CommentSection/CommentSection.module.css` - 添加 replyTo 样式
- **效果**:
  - 一级评论：正常显示
  - 二级评论（直接回复一级）：正常显示，不带 @
  - 三级及以下评论：显示 `回复 @被回复者：内容`

---

### Bug 修复

#### 1. 评论框字数统计与按钮重叠
- **问题**: 评论输入框的 "0/500" 字数统计与 "发表评论" 按钮位置重叠
- **解决方案**: 调整 CSS 样式，给输入框添加底部间距
- **修改文件**:
  - `yuri-archive/src/components/CommentSection/CommentSection.module.css`
    - `.commentInput` 添加 `margin-bottom: 8px`
    - `.formFooter` 增加 `margin-top: 16px` 和 `clear: both`

#### 2. 移动端侧边栏不自动隐藏
- **问题**: 浏览器窗口缩小时，侧边栏仍然显示，遮挡内容
- **解决方案**: 添加窗口大小监听，移动端自动收起侧边栏
- **修改文件**:
  - `yuri-archive/src/components/Layout/index.tsx`
    - 添加 `MOBILE_BREAKPOINT = 768` 常量
    - 添加 `useEffect` 监听窗口 resize 事件
    - 窗口宽度小于 768px 时自动收起侧边栏

---

## 待办事项

- [ ] 图片画廊评论功能（如需要）
- [ ] 评论点赞功能
- [ ] 评论排序（最新/最热）
- [ ] @用户通知功能

---

## 贡献者

- 开发者
