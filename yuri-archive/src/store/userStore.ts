import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '../types'

interface UserStore {
  currentUser: User | null
  token: string | null
  isLoggedIn: boolean
  setUser: (user: User, token?: string) => void
  logout: () => void
}

export const useUserStore = create<UserStore>()(
  persist(
    (set, get) => ({
      currentUser: null,
      token: null,
      isLoggedIn: false,
      
      setUser: (user: User, token?: string) => {
        if (token) {
          localStorage.setItem('token', token)
          set({
            currentUser: user,
            token,
            isLoggedIn: true,
          })
        } else {
          // 只更新用户信息，保留原有 token
          set({
            currentUser: user,
          })
        }
      },
      
      logout: () => {
        localStorage.removeItem('token')
        set({
          currentUser: null,
          token: null,
          isLoggedIn: false,
        })
      },
    }),
    {
      name: 'yuri-archive-user',
      partialize: (state) => ({
        currentUser: state.currentUser,
        token: state.token,
        isLoggedIn: state.isLoggedIn,
      }),
    }
  )
)
