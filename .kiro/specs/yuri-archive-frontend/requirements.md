# Requirements Document

## Introduction

百合文学档案馆前端MVP开发，使用 React + Vite + Ant Design + Zustand 技术栈。本阶段专注于前端界面开发，使用假数据模拟后端API，暂不实现真实的注册登录功能。

## Glossary

- **Archive_System**: 百合文学档案馆前端应用系统
- **Article_List**: 文章列表组件，展示文章卡片流
- **Article_Detail**: 文章详情页组件
- **Tag_System**: 标签系统，用于文章分类和筛选
- **Search_Module**: 搜索模块，支持关键词搜索
- **User_Center**: 用户个人中心页面
- **Mock_Data**: 模拟数据层，提供假数据支持开发

## Requirements

### Requirement 1: 项目基础架构

**User Story:** 作为开发者，我需要搭建项目基础架构，以便后续功能开发有统一的代码组织结构。

#### Acceptance Criteria

1. THE Archive_System SHALL 使用 Vite 创建 React + TypeScript 项目
2. THE Archive_System SHALL 集成 Ant Design 5.x 作为UI组件库
3. THE Archive_System SHALL 集成 Zustand 作为状态管理方案
4. THE Archive_System SHALL 集成 React Router 6.x 实现路由管理
5. THE Archive_System SHALL 配置响应式布局支持移动端和桌面端

### Requirement 2: 模拟数据层

**User Story:** 作为开发者，我需要一个模拟数据层，以便在没有后端的情况下进行前端开发和测试。

#### Acceptance Criteria

1. THE Mock_Data SHALL 提供至少10篇模拟文章数据，包含标题、摘要、正文(Markdown)、作者、标签、阅读量、发布时间
2. THE Mock_Data SHALL 提供至少5个模拟标签数据
3. THE Mock_Data SHALL 提供模拟用户数据（用于展示作者信息）
4. THE Mock_Data SHALL 提供模拟收藏数据
5. WHEN 组件请求数据时，THE Mock_Data SHALL 模拟异步API调用行为（带延迟）

### Requirement 3: 全局布局与导航

**User Story:** 作为用户，我需要清晰的页面布局和导航，以便快速访问各个功能模块。

#### Acceptance Criteria

1. THE Archive_System SHALL 展示顶部导航栏，包含Logo、搜索框、用户入口
2. THE Archive_System SHALL 展示页脚，包含版权信息
3. WHEN 用户点击Logo时，THE Archive_System SHALL 导航至首页
4. WHEN 用户在搜索框输入关键词并提交时，THE Archive_System SHALL 导航至搜索结果页
5. THE Archive_System SHALL 在移动端显示响应式导航菜单

### Requirement 4: 首页文章列表

**User Story:** 作为用户，我需要在首页浏览文章列表，以便发现感兴趣的内容。

#### Acceptance Criteria

1. WHEN 用户访问首页时，THE Article_List SHALL 以卡片流形式展示文章列表
2. THE Article_List SHALL 每张卡片展示：封面图（若有）、标题、摘要、作者、标签、阅读量、发布时间
3. THE Article_List SHALL 支持分页功能，每页显示10篇文章
4. WHEN 用户点击文章卡片时，THE Archive_System SHALL 导航至该文章详情页
5. WHEN 用户点击标签时，THE Archive_System SHALL 导航至该标签的筛选列表页
6. THE Archive_System SHALL 在首页上方展示热门标签云

### Requirement 5: 文章详情页

**User Story:** 作为用户，我需要查看文章详情，以便阅读完整内容。

#### Acceptance Criteria

1. WHEN 用户访问文章详情页时，THE Article_Detail SHALL 展示文章标题、作者信息、发布时间、阅读量
2. THE Article_Detail SHALL 展示文章标签列表
3. THE Article_Detail SHALL 将Markdown正文渲染为HTML富文本
4. THE Article_Detail SHALL 提供"收藏"按钮（模拟登录用户）
5. THE Article_Detail SHALL 提供"返回列表"按钮
6. WHEN 用户点击作者名称时，THE Archive_System SHALL 导航至该作者的个人页面

### Requirement 6: 搜索功能

**User Story:** 作为用户，我需要搜索文章，以便快速找到感兴趣的内容。

#### Acceptance Criteria

1. WHEN 用户提交搜索关键词时，THE Search_Module SHALL 在标题、摘要、作者字段中进行匹配
2. THE Search_Module SHALL 展示搜索结果数量
3. THE Search_Module SHALL 以与首页相同的卡片形式展示搜索结果
4. THE Search_Module SHALL 支持按时间排序
5. WHEN 搜索无结果时，THE Search_Module SHALL 展示友好的空状态提示

### Requirement 7: 标签筛选

**User Story:** 作为用户，我需要按标签筛选文章，以便浏览特定类型的内容。

#### Acceptance Criteria

1. WHEN 用户点击某个标签时，THE Tag_System SHALL 展示该标签下的所有文章
2. THE Tag_System SHALL 在筛选页面显示当前选中的标签名称
3. THE Tag_System SHALL 支持分页功能
4. WHEN 该标签下无文章时，THE Tag_System SHALL 展示友好的空状态提示

### Requirement 8: 用户个人中心

**User Story:** 作为用户，我需要查看个人中心，以便管理我的投稿和收藏。

#### Acceptance Criteria

1. THE User_Center SHALL 展示用户信息侧边栏（头像、昵称、简介）
2. THE User_Center SHALL 提供"我的投稿"标签页，展示用户发布的文章列表
3. THE User_Center SHALL 提供"我的收藏"标签页，展示用户收藏的文章列表
4. WHEN 用户在"我的投稿"中点击文章时，THE Archive_System SHALL 导航至该文章详情页
5. WHEN 用户在"我的收藏"中点击文章时，THE Archive_System SHALL 导航至该文章详情页

### Requirement 9: 状态管理

**User Story:** 作为开发者，我需要统一的状态管理，以便组件间数据共享和状态同步。

#### Acceptance Criteria

1. THE Archive_System SHALL 使用Zustand管理全局用户状态（模拟登录用户）
2. THE Archive_System SHALL 使用Zustand管理收藏状态
3. WHEN 用户收藏/取消收藏文章时，THE Archive_System SHALL 实时更新收藏状态
4. THE Archive_System SHALL 在页面刷新后保持收藏状态（使用localStorage持久化）
