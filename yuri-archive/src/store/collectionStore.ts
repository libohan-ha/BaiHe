import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const STORAGE_KEY = 'anime-archive-collections'

interface CollectionStore {
  collections: string[] // 收藏的文章ID列表
  isCollected: (articleId: string) => boolean
  toggleCollection: (articleId: string) => void
  loadCollections: () => void
}

export const useCollectionStore = create<CollectionStore>()(
  persist(
    (set, get) => ({
      collections: [],
      
      isCollected: (articleId: string) => {
        return get().collections.includes(articleId)
      },
      
      toggleCollection: (articleId: string) => {
        const { collections } = get()
        if (collections.includes(articleId)) {
          // 取消收藏
          set({ collections: collections.filter(id => id !== articleId) })
        } else {
          // 添加收藏
          set({ collections: [...collections, articleId] })
        }
      },
      
      loadCollections: () => {
        // persist 中间件会自动从 localStorage 加载
        // 这个方法主要用于手动触发重新加载
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored) {
          try {
            const parsed = JSON.parse(stored)
            if (parsed.state?.collections) {
              set({ collections: parsed.state.collections })
            }
          } catch {
            // 解析失败，保持当前状态
          }
        }
      },
    }),
    {
      name: STORAGE_KEY,
    }
  )
)
