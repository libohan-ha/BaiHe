# Implementation Plan: 百合文学档案馆前端

## Overview

本实现计划将设计文档转化为可执行的开发任务，采用增量开发方式，从项目骨架开始，逐步实现各个功能模块。使用 TypeScript 进行开发。

## Tasks

- [x] 1. 项目初始化与基础配置
  - [x] 1.1 使用 Vite 创建 React + TypeScript 项目
    - 执行 `npm create vite@latest` 创建项目
    - 配置 TypeScript 严格模式
    - _Requirements: 1.1_
  - [x] 1.2 安装核心依赖
    - 安装 antd, zustand, react-router-dom, react-markdown, dayjs
    - 安装开发依赖 vitest, @testing-library/react, fast-check
    - _Requirements: 1.2, 1.3, 1.4_
  - [x] 1.3 配置 Ant Design 主题
    - 使用 ConfigProvider 配置粉紫色主题
    - 配置全局样式
    - _Requirements: 1.5_

- [x] 2. 类型定义与模拟数据
  - [x] 2.1 创建 TypeScript 类型定义
    - 在 src/types/index.ts 定义 User, Article, Tag, Collection 等类型
    - 定义 PaginatedResponse, SearchParams 等工具类型
    - _Requirements: 2.1, 2.2, 2.3, 2.4_
  - [x] 2.2 创建模拟数据
    - 在 src/mock/ 目录创建 users.ts, tags.ts, articles.ts
    - 创建至少10篇文章、5个标签、3个用户的模拟数据
    - _Requirements: 2.1, 2.2, 2.3_
  - [x] 2.3 创建模拟 API 服务
    - 在 src/services/mockApi.ts 实现模拟 API
    - 实现 getArticles, getArticleById, searchArticles, getTags 等方法
    - 添加模拟延迟（200-500ms）
    - _Requirements: 2.5_
  - [ ]* 2.4 编写模拟数据属性测试
    - **Property 1: Mock Data Completeness**
    - **Property 2: Mock API Async Behavior**
    - **Validates: Requirements 2.1, 2.2, 2.5**

- [x] 3. Zustand 状态管理
  - [x] 3.1 创建用户状态 Store
    - 在 src/store/userStore.ts 实现 useUserStore
    - 实现 setUser, logout 方法
    - 初始化模拟登录用户
    - _Requirements: 9.1_
  - [x] 3.2 创建收藏状态 Store
    - 在 src/store/collectionStore.ts 实现 useCollectionStore
    - 实现 isCollected, toggleCollection, loadCollections 方法
    - 使用 localStorage 持久化收藏状态
    - _Requirements: 9.2, 9.3, 9.4_
  - [ ]* 3.3 编写收藏状态属性测试
    - **Property 10: Collection Toggle Consistency**
    - **Property 11: Collection Persistence**
    - **Validates: Requirements 9.3, 9.4**

- [x] 4. 全局布局组件
  - [x] 4.1 创建 Header 组件
    - 实现 Logo、搜索框、用户头像下拉菜单
    - 实现响应式导航（移动端汉堡菜单）
    - _Requirements: 3.1, 3.3, 3.4, 3.5_
  - [x] 4.2 创建 Footer 组件
    - 实现版权信息展示
    - _Requirements: 3.2_
  - [x] 4.3 创建 Layout 组件
    - 组合 Header 和 Footer
    - 使用 Ant Design Layout 组件
    - 配置路由 Outlet
    - _Requirements: 3.1, 3.2_

- [x] 5. 路由配置
  - [x] 5.1 配置 React Router
    - 在 src/App.tsx 配置路由
    - 定义首页、文章详情、搜索、标签、用户中心路由
    - _Requirements: 1.4_

- [x] 6. Checkpoint - 基础架构验证
  - 确保项目可以正常启动
  - 确保路由导航正常工作
  - 确保所有测试通过，如有问题请询问用户

- [x] 7. 文章卡片与列表组件
  - [x] 7.1 创建 ArticleCard 组件
    - 使用 Ant Design Card 组件
    - 展示封面图、标题、摘要、作者、标签、阅读量、时间
    - 实现标签点击事件
    - _Requirements: 4.2_
  - [x] 7.2 创建 ArticleList 组件
    - 使用 Ant Design List 组件
    - 集成 ArticleCard
    - 实现分页功能
    - 实现加载状态（骨架屏）
    - _Requirements: 4.1, 4.3_
  - [ ]* 7.3 编写文章卡片属性测试
    - **Property 3: Article Card Information Completeness**
    - **Property 4: Pagination Constraint**
    - **Validates: Requirements 4.2, 4.3**

- [x] 8. 标签云组件
  - [x] 8.1 创建 TagCloud 组件
    - 使用 Ant Design Tag 组件
    - 展示热门标签
    - 实现标签点击事件
    - _Requirements: 4.6_

- [x] 9. 首页实现
  - [x] 9.1 创建 HomePage 组件
    - 集成 TagCloud 和 ArticleList
    - 实现文章列表加载和分页
    - _Requirements: 4.1, 4.4, 4.5, 4.6_

- [x] 10. Markdown 渲染组件
  - [x] 10.1 创建 MarkdownRenderer 组件
    - 使用 react-markdown 渲染 Markdown
    - 配置代码高亮（可选）
    - 配置安全的 HTML 渲染
    - _Requirements: 5.3_
  - [ ]* 10.2 编写 Markdown 渲染属性测试
    - **Property 6: Markdown Rendering Validity**
    - **Validates: Requirements 5.3**

- [x] 11. 文章详情页
  - [x] 11.1 创建 ArticleDetailPage 组件
    - 展示文章标题、作者、时间、阅读量、标签
    - 集成 MarkdownRenderer 渲染正文
    - 实现收藏按钮功能
    - 实现返回列表按钮
    - 实现作者链接跳转
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_
  - [ ]* 11.2 编写文章详情属性测试
    - **Property 5: Article Detail Completeness**
    - **Validates: Requirements 5.1**

- [x] 12. Checkpoint - 核心功能验证
  - 确保首页文章列表正常展示
  - 确保文章详情页正常渲染
  - 确保收藏功能正常工作
  - 确保所有测试通过，如有问题请询问用户

- [x] 13. 搜索功能
  - [x] 13.1 创建 SearchBox 组件
    - 使用 Ant Design Input.Search 组件
    - 实现搜索提交事件
    - _Requirements: 3.4_
  - [x] 13.2 创建 SearchPage 组件
    - 展示搜索关键词和结果数量
    - 集成 ArticleList 展示搜索结果
    - 实现按时间排序
    - 实现空结果状态
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_
  - [ ]* 13.3 编写搜索功能属性测试
    - **Property 7: Search Result Relevance**
    - **Property 8: Time-based Sorting**
    - **Validates: Requirements 6.1, 6.4**

- [x] 14. 标签筛选页
  - [x] 14.1 创建 TagPage 组件
    - 展示当前标签名称
    - 集成 ArticleList 展示该标签下的文章
    - 实现分页功能
    - 实现空结果状态
    - _Requirements: 7.1, 7.2, 7.3, 7.4_
  - [ ]* 14.2 编写标签筛选属性测试
    - **Property 9: Tag Filter Correctness**
    - **Validates: Requirements 7.1**

- [x] 15. 用户个人中心
  - [x] 15.1 创建 UserCenterPage 组件
    - 展示用户信息侧边栏（头像、昵称、简介）
    - 实现"我的投稿"标签页
    - 实现"我的收藏"标签页
    - 集成 ArticleList 展示文章
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 16. Final Checkpoint - 完整功能验证
  - 确保所有页面正常工作
  - 确保所有导航正常
  - 确保所有测试通过，如有问题请询问用户

## Notes

- 任务标记 `*` 的为可选测试任务，可跳过以加快MVP开发
- 每个任务都引用了具体的需求条款以便追溯
- Checkpoint 任务用于阶段性验证，确保增量开发的稳定性
- 属性测试验证核心业务逻辑的正确性
