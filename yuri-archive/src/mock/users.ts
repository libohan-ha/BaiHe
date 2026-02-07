import type { User } from '../types'

export const mockUsers: User[] = [
  {
    id: 'user-1',
    username: '樱花落',
    email: 'sakura@example.com',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sakura',
    bio: '动漫内容爱好者，偶尔写写短篇',
    role: 'USER',
    createdAt: '2024-01-15T08:00:00Z',
    updatedAt: '2024-06-01T10:30:00Z',
  },
  {
    id: 'user-2',
    username: '月见草',
    email: 'tsukimi@example.com',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=tsukimi',
    bio: '专注校园动漫，温馨治愈向',
    role: 'USER',
    createdAt: '2024-02-20T12:00:00Z',
    updatedAt: '2024-05-15T14:20:00Z',
  },
  {
    id: 'user-3',
    username: '紫藤花',
    email: 'wisteria@example.com',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=wisteria',
    bio: '喜欢写职场题材和都市爱情',
    role: 'ADMIN',
    createdAt: '2023-12-01T09:00:00Z',
    updatedAt: '2024-06-10T16:45:00Z',
  },
]

// 当前登录用户（模拟）
export const currentUser: User = mockUsers[0]
