# Design Document: 百合文学档案馆前端

## Overview

本设计文档描述百合文学档案馆前端MVP的技术架构和实现方案。采用 React + Vite + TypeScript + Ant Design + Zustand 技术栈，使用模拟数据进行开发，实现文章浏览、搜索、标签筛选、收藏等核心功能。

## Architecture

### 整体架构

```
┌─────────────────────────────────────────────────────────┐
│                    React Application                     │
├─────────────────────────────────────────────────────────┤
│  Pages (路由页面)                                        │
│  ├── HomePage          首页                              │
│  ├── ArticleDetailPage 文章详情                          │
│  ├── SearchPage        搜索结果                          │
│  ├── TagPage           标签筛选                          │
│  └── UserCenterPage    用户中心                          │
├─────────────────────────────────────────────────────────┤
│  Components (可复用组件)                                  │
│  ├── Layout            全局布局(Header/Footer)           │
│  ├── ArticleCard       文章卡片                          │
│  ├── ArticleList       文章列表                          │
│  ├── TagCloud          标签云                            │
│  ├── SearchBox         搜索框                            │
│  └── MarkdownRenderer  Markdown渲染器                    │
├─────────────────────────────────────────────────────────┤
│  Store (Zustand状态管理)                                  │
│  ├── useUserStore      用户状态                          │
│  └── useCollectionStore 收藏状态                         │
├─────────────────────────────────────────────────────────┤
│  Services (数据服务层)                                    │
│  └── mockApi           模拟API服务                       │
├─────────────────────────────────────────────────────────┤
│  Mock Data (模拟数据)                                     │
│  ├── articles          文章数据                          │
│  ├── tags              标签数据                          │
│  └── users             用户数据                          │
└─────────────────────────────────────────────────────────┘
```

### 目录结构

```
src/
├── components/          # 可复用组件
│   ├── Layout/
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   └── index.tsx
│   ├── ArticleCard/
│   ├── ArticleList/
│   ├── TagCloud/
│   ├── SearchBox/
│   └── MarkdownRenderer/
├── pages/               # 页面组件
│   ├── HomePage/
│   ├── ArticleDetailPage/
│   ├── SearchPage/
│   ├── TagPage/
│   └── UserCenterPage/
├── store/               # Zustand状态管理
│   ├── userStore.ts
│   └── collectionStore.ts
├── services/            # API服务层
│   └── mockApi.ts
├── mock/                # 模拟数据
│   ├── articles.ts
│   ├── tags.ts
│   └── users.ts
├── types/               # TypeScript类型定义
│   └── index.ts
├── utils/               # 工具函数
│   └── index.ts
├── App.tsx              # 根组件
├── main.tsx             # 入口文件
└── index.css            # 全局样式
```

## Components and Interfaces

### 类型定义 (types/index.ts)

```typescript
// 用户类型
interface User {
  id: string;
  username: string;
  email: string;
  avatarUrl?: string;
  bio?: string;
  role: 'USER' | 'ADMIN';
  createdAt: string;
}

// 标签类型
interface Tag {
  id: string;
  name: string;
  articleCount: number;
}

// 文章类型
interface Article {
  id: string;
  title: string;
  summary: string;
  content: string;      // Markdown内容
  coverUrl?: string;
  authorId: string;
  author: User;
  views: number;
  status: 'DRAFT' | 'PUBLISHED';
  tags: Tag[];
  createdAt: string;
  updatedAt: string;
}

// 收藏类型
interface Collection {
  id: string;
  userId: string;
  articleId: string;
  createdAt: string;
}

// 分页响应类型
interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// 搜索参数类型
interface SearchParams {
  keyword?: string;
  tagId?: string;
  page?: number;
  pageSize?: number;
  sortBy?: 'time' | 'views';
}
```

### 核心组件接口

```typescript
// ArticleCard Props
interface ArticleCardProps {
  article: Article;
  onTagClick?: (tagId: string) => void;
}

// ArticleList Props
interface ArticleListProps {
  articles: Article[];
  loading?: boolean;
  pagination?: {
    current: number;
    total: number;
    pageSize: number;
    onChange: (page: number) => void;
  };
  onTagClick?: (tagId: string) => void;
}

// TagCloud Props
interface TagCloudProps {
  tags: Tag[];
  onTagClick?: (tagId: string) => void;
  maxDisplay?: number;
}

// SearchBox Props
interface SearchBoxProps {
  defaultValue?: string;
  onSearch: (keyword: string) => void;
  placeholder?: string;
}

// MarkdownRenderer Props
interface MarkdownRendererProps {
  content: string;
}
```

### Zustand Store 接口

```typescript
// 用户状态Store
interface UserStore {
  currentUser: User | null;
  isLoggedIn: boolean;
  setUser: (user: User) => void;
  logout: () => void;
}

// 收藏状态Store
interface CollectionStore {
  collections: string[];  // 收藏的文章ID列表
  isCollected: (articleId: string) => boolean;
  toggleCollection: (articleId: string) => void;
  loadCollections: () => void;
}
```

### Mock API 接口

```typescript
// 模拟API服务
interface MockApiService {
  // 文章相关
  getArticles: (params: SearchParams) => Promise<PaginatedResponse<Article>>;
  getArticleById: (id: string) => Promise<Article | null>;
  getArticlesByTag: (tagId: string, page: number) => Promise<PaginatedResponse<Article>>;
  searchArticles: (keyword: string, page: number) => Promise<PaginatedResponse<Article>>;
  
  // 标签相关
  getTags: () => Promise<Tag[]>;
  getPopularTags: (limit: number) => Promise<Tag[]>;
  
  // 用户相关
  getUserById: (id: string) => Promise<User | null>;
  getUserArticles: (userId: string, page: number) => Promise<PaginatedResponse<Article>>;
}
```

## Data Models

### 模拟数据结构

模拟数据将存储在 `src/mock/` 目录下，包含：

1. **users.ts** - 3个模拟用户（包含1个当前登录用户）
2. **tags.ts** - 8个模拟标签
3. **articles.ts** - 12篇模拟文章，包含完整的Markdown内容

### 数据关系

```
User (1) ──────< Article (N)
                    │
                    │
Tag (M) >──────────<┘ (多对多)

User (1) ──────< Collection (N) >────── Article (1)
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*



Based on the prework analysis, the following correctness properties have been identified:

### Property 1: Mock Data Completeness
*For any* call to get mock articles, the returned array SHALL contain at least 10 articles, and *for any* call to get mock tags, the returned array SHALL contain at least 5 tags.
**Validates: Requirements 2.1, 2.2**

### Property 2: Mock API Async Behavior
*For any* mock API function call, the function SHALL return a Promise that resolves after a simulated delay.
**Validates: Requirements 2.5**

### Property 3: Article Card Information Completeness
*For any* article rendered as a card, the card output SHALL contain the article's title, summary, author name, at least one tag, view count, and creation date.
**Validates: Requirements 4.2**

### Property 4: Pagination Constraint
*For any* paginated request with pageSize=10, the returned data array SHALL contain at most 10 items.
**Validates: Requirements 4.3, 7.3**

### Property 5: Article Detail Completeness
*For any* valid article ID, the article detail page SHALL display the article's title, author information, creation date, view count, tags, and rendered content.
**Validates: Requirements 5.1**

### Property 6: Markdown Rendering Validity
*For any* valid Markdown string, the MarkdownRenderer component SHALL produce valid HTML output.
**Validates: Requirements 5.3**

### Property 7: Search Result Relevance
*For any* search keyword, all returned articles SHALL contain the keyword in at least one of: title, summary, or author name (case-insensitive).
**Validates: Requirements 6.1**

### Property 8: Time-based Sorting
*For any* search result sorted by time, the articles SHALL be ordered by creation date in descending order (newest first).
**Validates: Requirements 6.4**

### Property 9: Tag Filter Correctness
*For any* tag filter request, all returned articles SHALL contain the specified tag in their tags array.
**Validates: Requirements 7.1**

### Property 10: Collection Toggle Consistency
*For any* article, calling toggleCollection SHALL change the isCollected state from true to false or from false to true.
**Validates: Requirements 9.3**

### Property 11: Collection Persistence
*For any* collection state, after saving to localStorage and reloading, the loadCollections function SHALL restore the same collection state.
**Validates: Requirements 9.4**

## Error Handling

### API Error Handling
- Mock API 调用失败时显示 Ant Design 的 message.error 提示
- 文章不存在时显示 404 页面
- 网络错误时显示重试按钮

### 输入验证
- 搜索关键词为空时不执行搜索
- 无效的文章ID导航到404页面
- 无效的标签ID显示空状态

### 边界情况
- 空文章列表显示"暂无文章"提示
- 空搜索结果显示"未找到相关文章"提示
- 空收藏列表显示"暂无收藏"提示

## Testing Strategy

### 单元测试 (Unit Tests)
使用 Vitest + React Testing Library：
- 组件渲染测试（Header, Footer, ArticleCard等）
- Zustand Store 状态管理测试
- 工具函数测试

### 属性测试 (Property-Based Tests)
使用 fast-check 进行属性测试：
- 搜索结果相关性测试
- 分页约束测试
- 标签筛选正确性测试
- 收藏状态一致性测试
- Markdown渲染有效性测试

### 测试配置
- 每个属性测试运行至少100次迭代
- 使用 fast-check 生成随机测试数据
- 测试文件与源文件同目录，使用 `.test.ts` 后缀

## UI/UX Design Notes

### 配色方案
- 主色调：柔和的粉紫色系，符合百合主题
- 使用 Ant Design 的 ConfigProvider 自定义主题

### 响应式断点
- Mobile: < 768px
- Tablet: 768px - 1024px
- Desktop: > 1024px

### 关键交互
- 文章卡片 hover 效果
- 收藏按钮动画反馈
- 页面切换过渡动画
- 加载状态骨架屏
