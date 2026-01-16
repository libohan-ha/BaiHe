import type { AICharacter, Article, BatchTransferResult, ChatMessage, Conversation, CreateCharacterData, GalleryImage, ImageTag, PaginatedResponse, PrivateImage, PrivateImageStats, PrivateImageTag, Tag, UpdateCharacterData, User } from '../types'

/**
 * API Base URL 配置
 * 优先级：环境变量 > 自动判断
 * - 开发环境：使用空字符串（通过 Vite proxy 代理到 localhost:3000）
 * - 生产环境：使用相对路径 /api（通过 Nginx 反向代理到后端）
 */
const BASE_URL = import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? '' : '')

/**
 * 获取完整的图片URL
 * 开发环境：直接使用相对路径（通过 Vite proxy 代理到后端）
 * 生产环境：使用相对路径（通过 Nginx 反向代理到后端）
 */
export function getImageUrl(url: string | undefined | null): string | undefined {
  if (!url) return undefined

  // 如果已经是完整URL，直接返回
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url
  }

  // 相对路径直接返回，让 Vite proxy 或 Nginx 处理
  // 这样无论是本地访问还是局域网访问都能正确加载图片
  if (url.startsWith('/')) {
    return url
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

  const response = await fetch(`${BASE_URL}/api/upload/avatar`, {
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

  const response = await fetch(`${BASE_URL}/api/upload/cover`, {
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

export async function login(identifier: string, password: string): Promise<LoginResponse> {
  return request<LoginResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ identifier, password }),
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

export async function updateConversation(id: string, title: string): Promise<Conversation> {
  return request<Conversation>(`/api/ai-chat/conversations/${id}`, {
    method: 'PUT',
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

export async function sendChatMessage(conversationId: string, content: string, images?: string[]): Promise<ChatMessage> {
  return request<ChatMessage>(`/api/ai-chat/conversations/${conversationId}/messages`, {
    method: 'POST',
    body: JSON.stringify({ content, images }),
  })
}

export async function saveAssistantMessage(conversationId: string, content: string): Promise<ChatMessage> {
  return request<ChatMessage>(`/api/ai-chat/conversations/${conversationId}/assistant-message`, {
    method: 'POST',
    body: JSON.stringify({ content }),
  })
}

// 重新生成AI回复 (返回流式响应)
export async function regenerateAssistantMessage(
  conversationId: string,
  messageId: string,
  apiConfig: { apiUrl: string; apiKey: string; model: string }
): Promise<Response> {
  const token = localStorage.getItem('token')
  
  const response = await fetch(`${BASE_URL}/api/ai-chat/conversations/${conversationId}/messages/${messageId}/regenerate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    },
    body: JSON.stringify(apiConfig)
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.message || '重新生成失败')
  }

  return response
}

// 编辑用户消息并重新生成AI回复 (返回流式响应)
export async function editAndRegenerateMessage(
  conversationId: string,
  messageId: string,
  content: string,
  apiConfig: { apiUrl: string; apiKey: string; model: string }
): Promise<Response> {
  const token = localStorage.getItem('token')
  
  const response = await fetch(`${BASE_URL}/api/ai-chat/conversations/${conversationId}/messages/${messageId}/edit-and-regenerate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    },
    body: JSON.stringify({ content, ...apiConfig })
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.message || '编辑并重新生成失败')
  }

  return response
}

// 上传AI角色相关图片 (头像/背景)
export async function uploadAIChatImage(file: File, type: 'avatar' | 'background'): Promise<UploadResponse> {
  const token = getToken()

  const formData = new FormData()
  formData.append('file', file)

  // 头像用 /api/upload/avatar，背景用 /api/upload/gallery
  const endpoint = type === 'avatar' ? '/api/upload/avatar' : '/api/upload/gallery'

  const response = await fetch(`${BASE_URL}${endpoint}`, {
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

// 上传聊天图片 (支持10MB)
export async function uploadChatImage(file: File): Promise<UploadResponse> {
  const token = getToken()

  const formData = new FormData()
  formData.append('file', file)

  const response = await fetch(`${BASE_URL}/api/upload/chat`, {
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

// ============ 图片压缩和转换工具函数 ============

// 压缩阈值 3.5MB
const IMAGE_COMPRESS_THRESHOLD = 3.5 * 1024 * 1024

/**
 * 压缩图片
 * 如果图片小于阈值，直接返回原图
 * 否则通过 Canvas 压缩
 */
export async function compressImage(file: File, maxSizeBytes: number = IMAGE_COMPRESS_THRESHOLD): Promise<File> {
  // 如果图片已经足够小，直接返回
  if (file.size <= maxSizeBytes) return file

  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let { width, height } = img

        // 如果尺寸 > 2048px，先缩小尺寸
        const maxDimension = 2048
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = (height * maxDimension) / width
            width = maxDimension
          } else {
            width = (width * maxDimension) / height
            height = maxDimension
          }
        }

        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('无法创建 Canvas 上下文'))
          return
        }

        ctx.drawImage(img, 0, 0, width, height)

        // 逐步降低质量直到文件大小合适
        let quality = 0.9
        const tryCompress = () => {
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('压缩失败'))
                return
              }

              if (blob.size <= maxSizeBytes || quality <= 0.1) {
                const compressedFile = new File([blob], file.name, {
                  type: 'image/jpeg',
                  lastModified: Date.now(),
                })
                resolve(compressedFile)
              } else {
                quality -= 0.1
                tryCompress()
              }
            },
            'image/jpeg',
            quality
          )
        }

        tryCompress()
      }
      img.onerror = () => reject(new Error('图片加载失败'))
      img.src = e.target?.result as string
    }
    reader.onerror = () => reject(new Error('文件读取失败'))
    reader.readAsDataURL(file)
  })
}

/**
 * 将图片 URL 转换为 base64
 * 用于发送给 AI API
 */
export async function imageUrlToBase64(imageUrl: string): Promise<string> {
  // 获取完整 URL
  const fullUrl = getImageUrl(imageUrl)
  if (!fullUrl) throw new Error('无效的图片 URL')

  const response = await fetch(fullUrl)
  const blob = await response.blob()
  
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      const base64 = reader.result as string
      resolve(base64)
    }
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

/**
 * 构建多模态消息格式（用于发送给 AI API）
 * 将包含图片的消息转换为 OpenAI 多模态格式
 */
export async function formatMessageWithImages(
  content: string,
  imageUrls?: string[]
): Promise<string | Array<{ type: string; text?: string; image_url?: { url: string } }>> {
  // 没有图片，返回普通文本
  if (!imageUrls || imageUrls.length === 0) {
    return content
  }

  // 有图片，构建多模态内容数组
  const contentParts: Array<{ type: string; text?: string; image_url?: { url: string } }> = []

  // 添加文本
  if (content.trim()) {
    contentParts.push({ type: 'text', text: content })
  }

  // 添加图片（转换为 base64）
  for (const imageUrl of imageUrls) {
    try {
      const base64Url = await imageUrlToBase64(imageUrl)
      contentParts.push({
        type: 'image_url',
        image_url: { url: base64Url },
      })
    } catch (err) {
      console.error('图片转换失败:', imageUrl, err)
    }
  }

  return contentParts
}

// ============ 隐私相册接口 ============

interface PrivateImagesResponse {
  images: PrivateImage[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

interface GetPrivateImagesParams {
  page?: number
  pageSize?: number
  tag?: string
  search?: string
  sort?: 'latest' | 'popular'
}

export async function getPrivateImages(params: GetPrivateImagesParams = {}): Promise<PaginatedResponse<PrivateImage>> {
  const searchParams = new URLSearchParams()
  
  if (params.page) searchParams.set('page', String(params.page))
  if (params.pageSize) searchParams.set('pageSize', String(params.pageSize))
  if (params.tag) searchParams.set('tag', params.tag)
  if (params.search) searchParams.set('search', params.search)
  if (params.sort) searchParams.set('sort', params.sort)

  const query = searchParams.toString()
  const endpoint = `/api/private-images${query ? `?${query}` : ''}`
  
  const result = await request<PrivateImagesResponse>(endpoint)
  
  return {
    data: result.images,
    total: result.pagination.total,
    page: result.pagination.page,
    pageSize: result.pagination.pageSize,
    totalPages: result.pagination.totalPages,
  }
}

export async function getPrivateImageById(id: string): Promise<PrivateImage> {
  return request<PrivateImage>(`/api/private-images/${id}`)
}

export async function getPrivateImageStats(): Promise<PrivateImageStats> {
  return request<PrivateImageStats>('/api/private-images/stats')
}

interface CreatePrivateImageData {
  title: string
  imageUrl: string
  thumbnailUrl?: string
  description?: string
  tagIds: string[]
}

export async function createPrivateImage(data: CreatePrivateImageData): Promise<PrivateImage> {
  const { tagIds, ...rest } = data
  return request<PrivateImage>('/api/private-images', {
    method: 'POST',
    body: JSON.stringify({ ...rest, tags: tagIds }),
  })
}

export async function updatePrivateImage(id: string, data: Partial<CreatePrivateImageData>): Promise<PrivateImage> {
  const { tagIds, ...rest } = data
  return request<PrivateImage>(`/api/private-images/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ ...rest, tags: tagIds }),
  })
}

export async function deletePrivateImage(id: string): Promise<void> {
  await request<null>(`/api/private-images/${id}`, {
    method: 'DELETE',
  })
}

// 从公开画廊转移单张图片到隐私相册
export async function transferToPrivateGallery(imageId: string): Promise<PrivateImage> {
  return request<PrivateImage>(`/api/private-images/transfer/${imageId}`, {
    method: 'POST',
  })
}

// 批量从公开画廊转移图片到隐私相册
export async function batchTransferToPrivateGallery(imageIds: string[]): Promise<BatchTransferResult> {
  return request<BatchTransferResult>('/api/private-images/transfer/batch', {
    method: 'POST',
    body: JSON.stringify({ imageIds }),
  })
}

// 上传隐私图片文件
export async function uploadPrivateImage(file: File): Promise<UploadResponse> {
  const token = getToken()
  
  const formData = new FormData()
  formData.append('file', file)

  const response = await fetch(`${BASE_URL}/api/private-images/upload`, {
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

// ============ 隐私图片标签接口 ============

interface PrivateImageTagsResponse {
  tags: PrivateImageTag[]
}

export async function getPrivateImageTags(): Promise<PrivateImageTag[]> {
  const result = await request<PrivateImageTagsResponse>('/api/private-image-tags')
  return result.tags
}

export async function getPopularPrivateImageTags(limit: number = 8): Promise<PrivateImageTag[]> {
  const tags = await request<PrivateImageTag[]>('/api/private-image-tags/popular?limit=' + limit)
  return tags
}

export async function createPrivateImageTag(name: string): Promise<PrivateImageTag> {
  return request<PrivateImageTag>('/api/private-image-tags', {
    method: 'POST',
    body: JSON.stringify({ name }),
  })
}

export async function updatePrivateImageTag(tagId: string, name: string): Promise<PrivateImageTag> {
  return request<PrivateImageTag>(`/api/private-image-tags/${tagId}`, {
    method: 'PUT',
    body: JSON.stringify({ name }),
  })
}

export async function deletePrivateImageTag(tagId: string): Promise<void> {
  await request<null>(`/api/private-image-tags/${tagId}`, {
    method: 'DELETE',
  })
}

// ============ 隐私图片收藏接口 ============

interface PrivateImageCollectionsResponse {
  collections: Array<{
    id: string
    imageId: string
    image?: PrivateImage
    createdAt: string
  }>
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

export async function getPrivateImageCollections(page: number = 1, pageSize: number = 12): Promise<PaginatedResponse<PrivateImage & { collectionId: string }>> {
  const result = await request<PrivateImageCollectionsResponse>(`/api/private-image-collections?page=${page}&pageSize=${pageSize}`)
  
  const imagesWithCollection = result.collections
    .filter(c => c.image)
    .map(c => ({ ...c.image!, collectionId: c.id }))
  
  if (imagesWithCollection.length === 0 && result.collections.length > 0) {
    const imagesPromises = result.collections.map(async (c) => {
      try {
        const image = await getPrivateImageById(c.imageId)
        return { ...image, collectionId: c.id }
      } catch {
        return null
      }
    })
    const images = await Promise.all(imagesPromises)
    return {
      data: images.filter((i): i is PrivateImage & { collectionId: string } => i !== null),
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

interface PrivateImageCollectionResponse {
  id: string
  imageId: string
  createdAt: string
}

export async function addPrivateImageCollection(imageId: string): Promise<PrivateImageCollectionResponse> {
  return request<PrivateImageCollectionResponse>('/api/private-image-collections', {
    method: 'POST',
    body: JSON.stringify({ imageId }),
  })
}

export async function removePrivateImageCollection(collectionId: string): Promise<void> {
  await request<null>(`/api/private-image-collections/${collectionId}`, {
    method: 'DELETE',
  })
}

interface CheckPrivateCollectionResponse {
  collected: boolean
  collectionId: string | null
}

export async function checkPrivateImageCollection(imageId: string): Promise<CheckPrivateCollectionResponse> {
  return request<CheckPrivateCollectionResponse>(`/api/private-image-collections/check/${imageId}`)
}

// ============ AI群聊接口 ============

// 群聊对话类型
export interface GroupConversation extends Conversation {
  isGroupChat: boolean
  backgroundUrl?: string | null
  members: GroupMember[]
}

export interface GroupMember {
  id: string
  conversationId: string
  aiCharacterId: string
  aiCharacter: AICharacter
  order: number
  createdAt: string
}

export interface GroupChatMessage extends ChatMessage {
  aiCharacterId?: string
  aiCharacter?: {
    id: string
    name: string
    avatarUrl: string | null
  }
}

// 创建群聊对话（不需要主角色ID）
export async function createGroupConversation(
  title: string,
  memberIds: string[]
): Promise<GroupConversation> {
  return request<GroupConversation>('/api/ai-group-chat/conversations', {
    method: 'POST',
    body: JSON.stringify({ title, memberIds }),
  })
}

// 获取用户的所有群聊对话列表
export async function getGroupConversations(): Promise<GroupConversation[]> {
  const result = await request<{ conversations: GroupConversation[] }>(
    '/api/ai-group-chat/conversations'
  )
  return result.conversations
}

// 删除群聊对话
export async function deleteGroupConversation(conversationId: string): Promise<void> {
  await request<null>(`/api/ai-group-chat/conversations/${conversationId}`, {
    method: 'DELETE',
  })
}

// 更新群聊标题
export async function updateGroupConversationTitle(conversationId: string, title: string): Promise<GroupConversation> {
  return request<GroupConversation>(`/api/ai-group-chat/conversations/${conversationId}/title`, {
    method: 'PATCH',
    body: JSON.stringify({ title }),
  })
}

// 更新群聊背景图片
export async function updateGroupConversationBackground(conversationId: string, backgroundUrl: string | null): Promise<GroupConversation> {
  return request<GroupConversation>(`/api/ai-group-chat/conversations/${conversationId}/background`, {
    method: 'PATCH',
    body: JSON.stringify({ backgroundUrl }),
  })
}

// 获取群聊成员列表
export async function getGroupMembers(conversationId: string): Promise<{ members: GroupMember[], backgroundUrl: string | null }> {
  const result = await request<{ members: GroupMember[], backgroundUrl: string | null }>(
    `/api/ai-group-chat/conversations/${conversationId}/members`
  )
  return result
}

// 添加群聊成员
export async function addGroupMember(conversationId: string, aiCharacterId: string): Promise<GroupMember> {
  return request<GroupMember>(`/api/ai-group-chat/conversations/${conversationId}/members`, {
    method: 'POST',
    body: JSON.stringify({ aiCharacterId }),
  })
}

// 移除群聊成员
export async function removeGroupMember(conversationId: string, aiCharacterId: string): Promise<void> {
  await request<null>(`/api/ai-group-chat/conversations/${conversationId}/members/${aiCharacterId}`, {
    method: 'DELETE',
  })
}

// 获取群聊消息
export async function getGroupChatMessages(conversationId: string): Promise<GroupChatMessage[]> {
  const result = await request<{ messages: GroupChatMessage[] }>(
    `/api/ai-group-chat/conversations/${conversationId}/messages`
  )
  return result.messages
}

// 发送用户消息到群聊
export async function sendGroupChatMessage(
  conversationId: string,
  content: string,
  images?: string[]
): Promise<GroupChatMessage> {
  return request<GroupChatMessage>(`/api/ai-group-chat/conversations/${conversationId}/messages`, {
    method: 'POST',
    body: JSON.stringify({ content, images }),
  })
}

// 群聊AI回复（SSE流式）
export async function groupChatWithAI(
  conversationId: string,
  apiConfigs: Record<string, { apiUrl: string; apiKey: string; model: string }>
): Promise<Response> {
  const token = localStorage.getItem('token')

  const response = await fetch(`${BASE_URL}/api/ai-group-chat/conversations/${conversationId}/ai-reply`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ apiConfigs }),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.message || '群聊AI回复失败')
  }

  return response
}
