import { io, Socket } from 'socket.io-client'
import { fixLocalUrl } from '../utils/aiConfig'

let socket: Socket | null = null

function resolveSocketUrl(): string | undefined {
  const envUrl = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL
  const rawUrl = envUrl || (import.meta.env.DEV ? 'http://localhost:3000' : window.location.origin)
  const fixedUrl = typeof window !== 'undefined' ? fixLocalUrl(rawUrl) : rawUrl
  return fixedUrl.endsWith('/') ? fixedUrl.slice(0, -1) : fixedUrl
}

export function connectSocket(token: string): Socket {
  if (socket?.connected) return socket

  const url = resolveSocketUrl()

  socket = url
    ? io(url, { auth: { token } })
    : io({ auth: { token } })

  socket.on('connect', () => {
    console.log('Socket 已连接')
  })

  socket.on('disconnect', () => {
    console.log('Socket 已断开')
  })

  socket.on('connect_error', (error) => {
    console.error('Socket 连接错误:', error.message)
  })

  return socket
}

export function disconnectSocket() {
  if (!socket) return
  socket.disconnect()
  socket = null
}

export function getSocket(): Socket | null {
  return socket
}
