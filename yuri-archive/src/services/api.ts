import type { AICharacter, Article, ChatMessage, Conversation, CreateCharacterData, GalleryImage, ImageTag, PaginatedResponse, Tag, UpdateCharacterData, User } from '../types'

/**
 * API Base URL 配置
 * 优先级：环境变量 > 自动判断
 * - 开发环境：使用空字符串（通过 Vite proxy 代理到 localhost:3000）
 * - 生产环境：使用相对路径 /api（通过 Nginx 反向代理到后端）
 */
const BASE_URL = import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? '' : '')

/**
 * 后端服务器地址（用于图片等静态资源）
 * 优先级：环境变量 > 自动判断
 * - 开发环境：http://localhost:3000
 * - 生产环境：使用相对路径（通过 Nginx 反向代理）
 */
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || (import.meta.env.DEV ? 'http://localhost:3000' : '')

/**
 * 获取完整的图片URL
 * 如果是相对路径，则拼接后端服务器地址
 */
export function getImageUrl(url: string | undefined | null): string | undefined {
  if (!url) return undefined

  // 如果已经是完整URL，直接返回
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url
  }

  // 如果是相对路径，拼接后端地址
  if (url.startsWith('/')) {
    return `${BACKEND_URL}${url}`
  }

  return url
}

// 统一响应格式
interface ApiResponse<T> {
  code: number
  message: string
  data: T
}

// 获取存储的 token
function getToken(): string | null {
  return localStorage.getItem('token')
}

// 通用请求函数
async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken()
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  }
  
  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  })

  const result: ApiResponse<T> = await response.json()

  if (result.code !== 200 && result.code !== 201) {
    throw new Error(result.message || '请求失败')
  }

  return result.data
}

// ============ 文件上传接口 ============

interface UploadResponse {
  url: string
  filename: string
  originalName: string
  size: number
  mimetype: string
}

export async function uploadAvatar(file: File): Promise<UploadResponse> {
  const token = getToken()
  
  const formData = new FormData()
  formData.append('file', file)
  formData.append('type', 'avatar')

  const response = await fetch(`${BASE_URL}/api/upload`, {
    method: 'POST',
    headers: token ? { 'Authorization': `Bearer ${token}` } : {},
    body: formData,
  })

  const result: ApiResponse<UploadResponse> = await response.json()

  if (result.code !== 200 && result.code !== 201) {
    throw new Error(result.message || '上传失败')
  }

  return result.data
}

export async function uploadCover(file: File): Promise<UploadResponse> {
  const token = getToken()
  
  const formData = new FormData()
  formData.append('file', file)
  formData.append('type', 'cover')

  const response = await fetch(`${BASE_URL}/api/upload`, {
    method: 'POST',
    headers: token ? { 'Authorization': `Bearer ${token}` } : {},
    body: formData,
  })

  const result: ApiResponse<UploadResponse> = await response.json()

  if (result.code !== 200 && result.code !== 201) {
    throw new Error(result.message || '上传失败')
  }

  return result.data
}

// ============ 认证接口 ============

interface LoginResponse {
  user: User
  token: string
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  return request<LoginResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}

export async function register(email: string, username: string, password: string): Promise<LoginResponse> {
  return request<LoginResponse>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, username, password }),
  })
}

export async function getProfile(): Promise<User> {
  return request<User>('/api/auth/profile')
}

export async function updateProfile(data: { username?: string; bio?: string; avatarUrl?: string }): Promise<User> {
  return request<User>('/api/auth/profile', {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

// ============ 文章接口 ============

interface ArticlesResponse {
  articles: Article[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

interface GetArticlesParams {
  page?: number
  pageSize?: number
  tag?: string
  search?: string
  sort?: 'latest' | 'popular'
  status?: string
}

export async function getArticles(params: GetArticlesParams = {}): Promise<PaginatedResponse<Article>> {
  const searchParams = new URLSearchParams()
  
  if (params.page) searchParams.set('page', String(params.page))
  if (params.pageSize) searchParams.set('pageSize', String(params.pageSize))
  if (params.tag) searchParams.set('tag', params.tag)
  if (params.search) searchParams.set('search', params.search)
  if (params.sort) searchParams.set('sort', params.sort)
  if (params.status) searchParams.set('status', params.status)

  const query = searchParams.toString()
  const endpoint = `/api/articles${query ? `?${query}` : ''}`
  
  const result = await request<ArticlesResponse>(endpoint)
  
  return {
    data: result.articles,
    total: result.pagination.total,
    page: result.pagination.page,
    pageSize: result.pagination.pageSize,
    totalPages: result.pagination.totalPages,
  }
}

export async function getArticleById(id: string): Promise<Article> {
  return request<Article>(`/api/articles/${id}`)
}

export async function getArticlesByTag(tagId: string, page: number = 1, pageSize: number = 10): Promise<PaginatedResponse<Article>> {
  return getArticles({ tag: tagId, page, pageSize })
}

export async function searchArticles(
  keyword: string,
  page: number = 1,
  pageSize: number = 10,
  sortBy: 'time' | 'views' = 'time'
): Promise<PaginatedResponse<Article>> {
  const sort = sortBy === 'time' ? 'latest' : 'popular'
  return getArticles({ search: keyword, page, pageSize, sort })
}

interface RelatedArticlesResponse {
  articles: Article[]
}

export async function getRelatedArticles(articleId: string): Promise<Article[]> {
  const result = await request<RelatedArticlesResponse>(`/api/articles/related/${articleId}`)
  return result.articles
}

interface CreateArticleData {
  title: string
  summary: string
  content: string
  coverUrl?: string
  tagIds: string[]
  status?: 'DRAFT' | 'PUBLISHED'
}

export async function createArticle(data: CreateArticleData): Promise<Article> {
  return request<Article>('/api/articles', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateArticle(id: string, data: Partial<CreateArticleData>): Promise<Article> {
  return request<Article>(`/api/articles/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export async function deleteArticle(id: string): Promise<void> {
  await request<null>(`/api/articles/${id}`, {
    method: 'DELETE',
  })
}

// ============ 标签接口 ============

interface TagsResponse {
  tags: Tag[]
}

export async function getTags(): Promise<Tag[]> {
  const result = await request<TagsResponse>('/api/tags')
  return result.tags
}

export async function getPopularTags(limit: number = 8): Promise<Tag[]> {
  const tags = await getTags()
  // 按文章数量排序，取前 limit 个
  return tags
    .sort((a, b) => (b.articleCount || 0) - (a.articleCount || 0))
    .slice(0, limit)
}

// ============ 用户接口 ============

export async function getUserById(id: string): Promise<User> {
  return request<User>(`/api/users/${id}`)
}

export async function getUserArticles(userId: string, page: number = 1, pageSize: number = 10): Promise<PaginatedResponse<Article>> {
  const result = await request<ArticlesResponse>(`/api/users/${userId}/articles?page=${page}&pageSize=${pageSize}`)
  
  return {
    data: result.articles,
    total: result.pagination.total,
    page: result.pagination.page,
    pageSize: result.pagination.pageSize,
    totalPages: result.pagination.totalPages,
  }
}

// ============ 收藏接口 ============

interface CollectionsResponse {
  collections: Array<{
    id: string
    articleId: string
    article?: Article
    createdAt: string
  }>
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

export async function getCollections(page: number = 1, pageSize: number = 10): Promise<PaginatedResponse<Article & { collectionId: string }>> {
  const result = await request<CollectionsResponse>(`/api/collections?page=${page}&pageSize=${pageSize}`)
  
  // 如果后端返回了 article 对象，直接使用
  const articlesWithCollection = result.collections
    .filter(c => c.article)
    .map(c => ({ ...c.article!, collectionId: c.id }))
  
  // 如果没有 article，需要单独获取
  if (articlesWithCollection.length === 0 && result.collections.length > 0) {
    const articlesPromises = result.collections.map(async (c) => {
      try {
        const article = await getArticleById(c.articleId)
        return { ...article, collectionId: c.id }
      } catch {
        return null
      }
    })
    const articles = await Promise.all(articlesPromises)
    return {
      data: articles.filter((a): a is Article & { collectionId: string } => a !== null),
      total: result.pagination.total,
      page: result.pagination.page,
      pageSize: result.pagination.pageSize,
      totalPages: result.pagination.totalPages,
    }
  }
  
  return {
    data: articlesWithCollection,
    total: result.pagination.total,
    page: result.pagination.page,
    pageSize: result.pagination.pageSize,
    totalPages: result.pagination.totalPages,
  }
}

interface CollectionResponse {
  id: string
  articleId: string
  createdAt: string
}

export async function addCollection(articleId: string): Promise<CollectionResponse> {
  return request<CollectionResponse>('/api/collections', {
    method: 'POST',
    body: JSON.stringify({ articleId }),
  })
}

export async function removeCollection(collectionId: string): Promise<void> {
  await request<null>(`/api/collections/${collectionId}`, {
    method: 'DELETE',
  })
}

// ============ 评论接口 ============

interface Comment {
  id: string
  content: string
  articleId: string | null
  imageId: string | null
  userId: string
  user: User
  parentId: string | null
  replyToUser?: User | null
  replies?: Comment[]
  createdAt: string
}

interface CommentsResponse {
  comments: Comment[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

// 评论目标参数类型
interface CommentTarget {
  articleId?: string
  imageId?: string
}

export async function getComments(target: CommentTarget, page: number = 1, pageSize: number = 10): Promise<CommentsResponse> {
  const params = new URLSearchParams()
  if (target.articleId) params.set('articleId', target.articleId)
  if (target.imageId) params.set('imageId', target.imageId)
  params.set('page', String(page))
  params.set('pageSize', String(pageSize))
  return request<CommentsResponse>(`/api/comments?${params.toString()}`)
}

export async function createComment(target: CommentTarget, content: string, parentId?: string): Promise<Comment> {
  // 构建请求体，只包含存在的字段
  const body: Record<string, string | undefined> = { content }
  
  if (target.articleId) {
    body.articleId = target.articleId
  }
  if (target.imageId) {
    body.imageId = target.imageId
  }
  if (parentId) {
    body.parentId = parentId
  }

  return request<Comment>('/api/comments', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export async function deleteComment(id: string): Promise<void> {
  await request<null>(`/api/comments/${id}`, {
    method: 'DELETE',
  })
}


// ============ 管理员接口 ============

interface AdminUsersResponse {
  users: User[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

export async function getAdminUsers(page: number = 1, pageSize: number = 10): Promise<PaginatedResponse<User>> {
  const result = await request<AdminUsersResponse>(`/api/admin/users?page=${page}&pageSize=${pageSize}`)
  return {
    data: result.users,
    total: result.pagination.total,
    page: result.pagination.page,
    pageSize: result.pagination.pageSize,
    totalPages: result.pagination.totalPages,
  }
}

export async function updateUserRole(userId: string, role: 'USER' | 'ADMIN'): Promise<{ id: string; role: string }> {
  return request<{ id: string; role: string }>(`/api/admin/users/${userId}/role`, {
    method: 'PUT',
    body: JSON.stringify({ role }),
  })
}

export async function deleteUser(userId: string): Promise<void> {
  await request<null>(`/api/admin/users/${userId}`, {
    method: 'DELETE',
  })
}

export async function getAdminArticles(page: number = 1, pageSize: number = 10): Promise<PaginatedResponse<Article>> {
  const result = await request<ArticlesResponse>(`/api/admin/articles?page=${page}&pageSize=${pageSize}`)
  return {
    data: result.articles,
    total: result.pagination.total,
    page: result.pagination.page,
    pageSize: result.pagination.pageSize,
    totalPages: result.pagination.totalPages,
  }
}

export async function updateArticleStatus(articleId: string, status: 'DRAFT' | 'PUBLISHED'): Promise<void> {
  await request<null>(`/api/admin/articles/${articleId}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  })
}

export async function deleteArticleAdmin(articleId: string): Promise<void> {
  await request<null>(`/api/admin/articles/${articleId}`, {
    method: 'DELETE',
  })
}


// ============ 标签管理接口 ============

export async function updateTag(tagId: string, name: string): Promise<Tag> {
  return request<Tag>(`/api/tags/${tagId}`, {
    method: 'PUT',
    body: JSON.stringify({ name }),
  })
}

export async function deleteTag(tagId: string): Promise<void> {
  await request<null>(`/api/tags/${tagId}`, {
    method: 'DELETE',
  })
}

export async function createTag(name: string): Promise<Tag> {
  return request<Tag>('/api/tags', {
    method: 'POST',
    body: JSON.stringify({ name }),
  })
}

// ============ 超级管理员接口 ============

interface AdminsResponse {
  admins: User[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

export async function getSuperAdmins(page: number = 1, pageSize: number = 10): Promise<PaginatedResponse<User>> {
  const result = await request<AdminsResponse>(`/api/admin?page=${page}&pageSize=${pageSize}`)
  return {
    data: result.admins,
    total: result.pagination.total,
    page: result.pagination.page,
    pageSize: result.pagination.pageSize,
    totalPages: result.pagination.totalPages,
  }
}

interface CreateAdminData {
  email: string
  username: string
  password: string
  role?: 'ADMIN' | 'SUPER_ADMIN'
}

export async function createAdmin(data: CreateAdminData): Promise<User> {
  return request<User>('/api/admin', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

interface UpdateAdminData {
  email?: string
  username?: string
  password?: string
  role?: 'ADMIN' | 'SUPER_ADMIN'
}

export async function updateAdmin(id: string, data: UpdateAdminData): Promise<User> {
  return request<User>(`/api/admin/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export async function deleteAdmin(id: string): Promise<void> {
  await request<null>(`/api/admin/${id}`, {
    method: 'DELETE',
  })
}

// ============ 图片画廊接口 ============

interface ImagesResponse {
  images: GalleryImage[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

interface GetImagesParams {
  page?: number
  pageSize?: number
  tag?: string
  search?: string
  sort?: 'latest' | 'popular'
}

export async function getImages(params: GetImagesParams = {}): Promise<PaginatedResponse<GalleryImage>> {
  const searchParams = new URLSearchParams()
  
  if (params.page) searchParams.set('page', String(params.page))
  if (params.pageSize) searchParams.set('pageSize', String(params.pageSize))
  if (params.tag) searchParams.set('tag', params.tag)
  if (params.search) searchParams.set('search', params.search)
  if (params.sort) searchParams.set('sort', params.sort)

  const query = searchParams.toString()
  const endpoint = `/api/images${query ? `?${query}` : ''}`
  
  const result = await request<ImagesResponse>(endpoint)
  
  return {
    data: result.images,
    total: result.pagination.total,
    page: result.pagination.page,
    pageSize: result.pagination.pageSize,
    totalPages: result.pagination.totalPages,
  }
}

export async function getImageById(id: string): Promise<GalleryImage> {
  return request<GalleryImage>(`/api/images/${id}`)
}

export async function getImagesByTag(tagId: string, page: number = 1, pageSize: number = 12): Promise<PaginatedResponse<GalleryImage>> {
  return getImages({ tag: tagId, page, pageSize })
}

export async function searchImages(
  keyword: string,
  page: number = 1,
  pageSize: number = 12,
  sortBy: 'time' | 'views' = 'time'
): Promise<PaginatedResponse<GalleryImage>> {
  const sort = sortBy === 'time' ? 'latest' : 'popular'
  return getImages({ search: keyword, page, pageSize, sort })
}

interface CreateImageData {
  title: string
  imageUrl: string
  thumbnailUrl?: string
  description?: string
  tagIds: string[]
}

export async function createImage(data: CreateImageData): Promise<GalleryImage> {
  // 将 tagIds 转换为 tags 发送给后端
  const { tagIds, ...rest } = data
  return request<GalleryImage>('/api/images', {
    method: 'POST',
    body: JSON.stringify({ ...rest, tags: tagIds }),
  })
}

export async function updateImage(id: string, data: Partial<CreateImageData>): Promise<GalleryImage> {
  // 将 tagIds 转换为 tags 发送给后端
  const { tagIds, ...rest } = data
  return request<GalleryImage>(`/api/images/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ ...rest, tags: tagIds }),
  })
}

export async function deleteImage(id: string): Promise<void> {
  await request<null>(`/api/images/${id}`, {
    method: 'DELETE',
  })
}

// 上传图片文件
export async function uploadGalleryImage(file: File): Promise<UploadResponse> {
  const token = getToken()
  
  const formData = new FormData()
  formData.append('file', file)

  const response = await fetch(`${BASE_URL}/api/upload/gallery`, {
    method: 'POST',
    headers: token ? { 'Authorization': `Bearer ${token}` } : {},
    body: formData,
  })

  const result: ApiResponse<UploadResponse> = await response.json()

  if (result.code !== 200 && result.code !== 201) {
    throw new Error(result.message || '上传失败')
  }

  return result.data
}

// ============ 图片标签接口 ============

interface ImageTagsResponse {
  tags: ImageTag[]
}

export async function getImageTags(): Promise<ImageTag[]> {
  const result = await request<ImageTagsResponse>('/api/image-tags')
  return result.tags
}

export async function getPopularImageTags(limit: number = 8): Promise<ImageTag[]> {
  const tags = await getImageTags()
  return tags
    .sort((a, b) => (b.imageCount || 0) - (a.imageCount || 0))
    .slice(0, limit)
}

export async function createImageTag(name: string): Promise<ImageTag> {
  return request<ImageTag>('/api/image-tags', {
    method: 'POST',
    body: JSON.stringify({ name }),
  })
}

export async function updateImageTag(tagId: string, name: string): Promise<ImageTag> {
  return request<ImageTag>(`/api/image-tags/${tagId}`, {
    method: 'PUT',
    body: JSON.stringify({ name }),
  })
}

export async function deleteImageTag(tagId: string): Promise<void> {
  await request<null>(`/api/image-tags/${tagId}`, {
    method: 'DELETE',
  })
}

// ============ 图片收藏接口 ============

interface ImageCollectionsResponse {
  collections: Array<{
    id: string
    imageId: string
    image?: GalleryImage
    createdAt: string
  }>
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

export async function getImageCollections(page: number = 1, pageSize: number = 12): Promise<PaginatedResponse<GalleryImage & { collectionId: string }>> {
  const result = await request<ImageCollectionsResponse>(`/api/image-collections?page=${page}&pageSize=${pageSize}`)
  
  const imagesWithCollection = result.collections
    .filter(c => c.image)
    .map(c => ({ ...c.image!, collectionId: c.id }))
  
  if (imagesWithCollection.length === 0 && result.collections.length > 0) {
    const imagesPromises = result.collections.map(async (c) => {
      try {
        const image = await getImageById(c.imageId)
        return { ...image, collectionId: c.id }
      } catch {
        return null
      }
    })
    const images = await Promise.all(imagesPromises)
    return {
      data: images.filter((i): i is GalleryImage & { collectionId: string } => i !== null),
      total: result.pagination.total,
      page: result.pagination.page,
      pageSize: result.pagination.pageSize,
      totalPages: result.pagination.totalPages,
    }
  }
  
  return {
    data: imagesWithCollection,
    total: result.pagination.total,
    page: result.pagination.page,
    pageSize: result.pagination.pageSize,
    totalPages: result.pagination.totalPages,
  }
}

interface ImageCollectionResponse {
  id: string
  imageId: string
  createdAt: string
}

export async function addImageCollection(imageId: string): Promise<ImageCollectionResponse> {
  return request<ImageCollectionResponse>('/api/image-collections', {
    method: 'POST',
    body: JSON.stringify({ imageId }),
  })
}

export async function removeImageCollection(collectionId: string): Promise<void> {
  await request<null>(`/api/image-collections/${collectionId}`, {
    method: 'DELETE',
  })
}

// ============ 用户图片接口 ============

export async function getUserImages(userId: string, page: number = 1, pageSize: number = 12): Promise<PaginatedResponse<GalleryImage>> {
  const result = await request<ImagesResponse>(`/api/users/${userId}/images?page=${page}&pageSize=${pageSize}`)
  
  return {
    data: result.images,
    total: result.pagination.total,
    page: result.pagination.page,
    pageSize: result.pagination.pageSize,
    totalPages: result.pagination.totalPages,
  }
}

// ============ 管理员图片接口 ============

export async function getAdminImages(page: number = 1, pageSize: number = 12): Promise<PaginatedResponse<GalleryImage>> {
  const result = await request<ImagesResponse>(`/api/admin/images?page=${page}&pageSize=${pageSize}`)
  return {
    data: result.images,
    total: result.pagination.total,
    page: result.pagination.page,
    pageSize: result.pagination.pageSize,
    totalPages: result.pagination.totalPages,
  }
}

export async function deleteImageAdmin(imageId: string): Promise<void> {
  await request<null>(`/api/admin/images/${imageId}`, {
    method: 'DELETE',
  })
}

// ============ AI聊天接口 ============

// AI角色相关
interface CharactersResponse {
  characters: AICharacter[]
}

export async function getAICharacters(): Promise<AICharacter[]> {
  const result = await request<CharactersResponse>('/api/ai-chat/characters')
  return result.characters
}

export async function getAICharacterById(id: string): Promise<AICharacter> {
  return request<AICharacter>(`/api/ai-chat/characters/${id}`)
}

export async function createAICharacter(data: CreateCharacterData): Promise<AICharacter> {
  return request<AICharacter>('/api/ai-chat/characters', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateAICharacter(id: string, data: UpdateCharacterData): Promise<AICharacter> {
  return request<AICharacter>(`/api/ai-chat/characters/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export async function deleteAICharacter(id: string): Promise<void> {
  await request<null>(`/api/ai-chat/characters/${id}`, {
    method: 'DELETE',
  })
}

// 对话相关
interface ConversationsResponse {
  conversations: Conversation[]
}

export async function getConversations(characterId: string): Promise<Conversation[]> {
  const result = await request<ConversationsResponse>(`/api/ai-chat/characters/${characterId}/conversations`)
  return result.conversations
}

export async function createConversation(characterId: string, title?: string): Promise<Conversation> {
  return request<Conversation>(`/api/ai-chat/characters/${characterId}/conversations`, {
    method: 'POST',
    body: JSON.stringify({ title }),
  })
}

export async function deleteConversation(id: string): Promise<void> {
  await request<null>(`/api/ai-chat/conversations/${id}`, {
    method: 'DELETE',
  })
}

// 消息相关
interface MessagesResponse {
  messages: ChatMessage[]
}

export async function getChatMessages(conversationId: string): Promise<ChatMessage[]> {
  const result = await request<MessagesResponse>(`/api/ai-chat/conversations/${conversationId}/messages`)
  return result.messages
}

export async function sendChatMessage(conversationId: string, content: string): Promise<ChatMessage> {
  return request<ChatMessage>(`/api/ai-chat/conversations/${conversationId}/messages`, {
    method: 'POST',
    body: JSON.stringify({ content }),
  })
}

export async function saveAssistantMessage(conversationId: string, content: string): Promise<ChatMessage> {
  return request<ChatMessage>(`/api/ai-chat/conversations/${conversationId}/assistant-message`, {
    method: 'POST',
    body: JSON.stringify({ content }),
  })
}

// 上传AI角色相关图片 (头像/背景)
export async function uploadAIChatImage(file: File, type: 'avatar' | 'background'): Promise<UploadResponse> {
  const token = getToken()

  const formData = new FormData()
  formData.append('file', file)
  formData.append('type', type === 'avatar' ? 'avatar' : 'gallery')

  const response = await fetch(`${BASE_URL}/api/upload`, {
    method: 'POST',
    headers: token ? { 'Authorization': `Bearer ${token}` } : {},
    body: formData,
  })

  const result: ApiResponse<UploadResponse> = await response.json()

  if (result.code !== 200 && result.code !== 201) {
    throw new Error(result.message || '上传失败')
  }

  return result.data
}
