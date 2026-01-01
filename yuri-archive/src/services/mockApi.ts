import type { Article, Tag, User, PaginatedResponse, SearchParams } from '../types'
import { allMockArticles, mockTags, mockUsers } from '../mock'

// 模拟网络延迟
const delay = (ms: number = 300) => new Promise(resolve => setTimeout(resolve, ms))

// 随机延迟 200-500ms
const randomDelay = () => delay(200 + Math.random() * 300)

/**
 * 获取文章列表（支持分页、搜索、标签筛选）
 */
export async function getArticles(params: SearchParams = {}): Promise<PaginatedResponse<Article>> {
  await randomDelay()
  
  const { keyword, tagId, page = 1, pageSize = 10, sortBy = 'time' } = params
  
  let filtered = allMockArticles.filter(a => a.status === 'PUBLISHED')
  
  // 关键词搜索
  if (keyword) {
    const lowerKeyword = keyword.toLowerCase()
    filtered = filtered.filter(article =>
      article.title.toLowerCase().includes(lowerKeyword) ||
      article.summary.toLowerCase().includes(lowerKeyword) ||
      article.author.username.toLowerCase().includes(lowerKeyword)
    )
  }
  
  // 标签筛选
  if (tagId) {
    filtered = filtered.filter(article =>
      article.tags.some(tag => tag.id === tagId)
    )
  }
  
  // 排序
  if (sortBy === 'time') {
    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  } else if (sortBy === 'views') {
    filtered.sort((a, b) => b.views - a.views)
  }
  
  // 分页
  const total = filtered.length
  const totalPages = Math.ceil(total / pageSize)
  const start = (page - 1) * pageSize
  const data = filtered.slice(start, start + pageSize)
  
  return {
    data,
    total,
    page,
    pageSize,
    totalPages,
  }
}

/**
 * 根据ID获取单篇文章
 */
export async function getArticleById(id: string): Promise<Article | null> {
  await randomDelay()
  return allMockArticles.find(a => a.id === id) || null
}

/**
 * 根据标签获取文章列表
 */
export async function getArticlesByTag(tagId: string, page: number = 1, pageSize: number = 10): Promise<PaginatedResponse<Article>> {
  return getArticles({ tagId, page, pageSize })
}

/**
 * 搜索文章
 */
export async function searchArticles(keyword: string, page: number = 1, pageSize: number = 10, sortBy: 'time' | 'views' = 'time'): Promise<PaginatedResponse<Article>> {
  return getArticles({ keyword, page, pageSize, sortBy })
}

/**
 * 获取所有标签
 */
export async function getTags(): Promise<Tag[]> {
  await randomDelay()
  return mockTags
}

/**
 * 获取热门标签
 */
export async function getPopularTags(limit: number = 8): Promise<Tag[]> {
  await randomDelay()
  return [...mockTags]
    .sort((a, b) => b.articleCount - a.articleCount)
    .slice(0, limit)
}

/**
 * 根据ID获取用户
 */
export async function getUserById(id: string): Promise<User | null> {
  await randomDelay()
  return mockUsers.find(u => u.id === id) || null
}

/**
 * 获取用户的文章列表
 */
export async function getUserArticles(userId: string, page: number = 1, pageSize: number = 10): Promise<PaginatedResponse<Article>> {
  await randomDelay()
  
  const userArticles = allMockArticles.filter(a => a.authorId === userId)
  
  const total = userArticles.length
  const totalPages = Math.ceil(total / pageSize)
  const start = (page - 1) * pageSize
  const data = userArticles.slice(start, start + pageSize)
  
  return {
    data,
    total,
    page,
    pageSize,
    totalPages,
  }
}

/**
 * 获取用户收藏的文章列表
 */
export async function getUserCollections(articleIds: string[], page: number = 1, pageSize: number = 10): Promise<PaginatedResponse<Article>> {
  await randomDelay()
  
  const collectedArticles = allMockArticles.filter(a => articleIds.includes(a.id))
  
  const total = collectedArticles.length
  const totalPages = Math.ceil(total / pageSize)
  const start = (page - 1) * pageSize
  const data = collectedArticles.slice(start, start + pageSize)
  
  return {
    data,
    total,
    page,
    pageSize,
    totalPages,
  }
}
