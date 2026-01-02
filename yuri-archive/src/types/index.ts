// 用户角色
export type UserRole = 'USER' | 'ADMIN' | 'SUPER_ADMIN'

// 文章状态
export type ArticleStatus = 'DRAFT' | 'PUBLISHED'

// 内容类型（用于区分文章和图片）
export type ContentType = 'article' | 'image'

// 用户类型
export interface User {
  id: string
  username: string
  email: string
  avatarUrl?: string
  bio?: string
  role: UserRole
  createdAt: string
  updatedAt: string
}

// 标签类型
export interface Tag {
  id: string
  name: string
  articleCount: number
  createdAt: string
}

// 文章类型
export interface Article {
  id: string
  title: string
  summary: string
  content: string // Markdown内容
  coverUrl?: string
  authorId: string
  author: User
  views: number
  status: ArticleStatus
  tags: Tag[]
  createdAt: string
  updatedAt: string
}

// 评论类型
export interface Comment {
  id: string
  content: string
  articleId: string
  userId: string
  user: User
  parentId: string | null
  replies?: Comment[]
  createdAt: string
}

// 评论区组件Props
export interface CommentSectionProps {
  articleId: string
}

// 收藏类型
export interface Collection {
  id: string
  userId: string
  articleId: string
  createdAt: string
}

// 分页响应类型
export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// 搜索参数类型
export interface SearchParams {
  keyword?: string
  tagId?: string
  page?: number
  pageSize?: number
  sortBy?: 'time' | 'views'
}

// 文章卡片Props
export interface ArticleCardProps {
  article: Article
  onTagClick?: (tagId: string) => void
}

// 文章列表Props
export interface ArticleListProps {
  articles: Article[]
  loading?: boolean
  pagination?: {
    current: number
    total: number
    pageSize: number
    onChange: (page: number) => void
  }
  onTagClick?: (tagId: string) => void
}

// 标签云Props
export interface TagCloudProps {
  tags: Tag[]
  onTagClick?: (tagId: string) => void
  maxDisplay?: number
}

// 搜索框Props
export interface SearchBoxProps {
  defaultValue?: string
  onSearch: (keyword: string) => void
  placeholder?: string
}

// Markdown渲染器Props
export interface MarkdownRendererProps {
  content: string
}

// ============ 图片画廊相关类型 ============

// 图片标签类型
export interface ImageTag {
  id: string
  name: string
  imageCount: number
  createdAt: string
}

// 图片类型
export interface GalleryImage {
  id: string
  title: string
  imageUrl: string
  thumbnailUrl?: string
  description?: string
  authorId: string
  author: User
  tags: ImageTag[]
  views: number
  createdAt: string
  updatedAt: string
}

// 图片收藏类型
export interface ImageCollection {
  id: string
  userId: string
  imageId: string
  createdAt: string
}

// 图片卡片Props
export interface GalleryCardProps {
  image: GalleryImage
  onTagClick?: (tagId: string) => void
  onImageClick?: (imageId: string) => void
}

// 图片列表Props
export interface GalleryListProps {
  images: GalleryImage[]
  loading?: boolean
  pagination?: {
    current: number
    total: number
    pageSize: number
    onChange: (page: number) => void
  }
  onTagClick?: (tagId: string) => void
  onImageClick?: (imageId: string) => void
}

// 图片标签云Props
export interface ImageTagCloudProps {
  tags: ImageTag[]
  onTagClick?: (tagId: string) => void
  maxDisplay?: number
}

// 侧边栏Props
export interface SidebarProps {
  collapsed?: boolean
  onCollapse?: (collapsed: boolean) => void
}

// ============ AI聊天相关类型 ============

// AI角色类型
export interface AICharacter {
  id: string
  name: string
  avatarUrl?: string
  userAvatarUrl?: string
  prompt: string
  backgroundUrl?: string
  modelName: string
  bubbleOpacity: number
  userId: string
  createdAt: string
  updatedAt: string
  _count?: {
    conversations: number
  }
}

// 对话类型
export interface Conversation {
  id: string
  title: string
  characterId: string
  userId: string
  createdAt: string
  updatedAt: string
  _count?: {
    messages: number
  }
}

// 聊天消息类型
export interface ChatMessage {
  id: string
  content: string
  role: 'user' | 'assistant'
  images?: string[]  // 用户上传的图片URL数组
  conversationId: string
  createdAt: string
}

// 创建AI角色参数
export interface CreateCharacterData {
  name: string
  avatarUrl?: string
  userAvatarUrl?: string
  prompt: string
  backgroundUrl?: string
  modelName?: string
  bubbleOpacity?: number
}

// 更新AI角色参数
export interface UpdateCharacterData {
  name?: string
  avatarUrl?: string
  userAvatarUrl?: string
  prompt?: string
  backgroundUrl?: string
  modelName?: string
  bubbleOpacity?: number
}
