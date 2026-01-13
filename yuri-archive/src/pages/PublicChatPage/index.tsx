 import { SendOutlined } from '@ant-design/icons'
 import { Avatar, Button, Input, message, Spin } from 'antd'
 import { useEffect, useRef, useState } from 'react'
 import { useNavigate } from 'react-router-dom'
 import { getImageUrl } from '../../services/api'
 import { connectSocket, disconnectSocket, getSocket } from '../../services/socket'
 import { useUserStore } from '../../store'
 import styles from './PublicChatPage.module.css'
 
 interface ChatMessage {
   id: string
   content: string
   imageUrl?: string
   userId: string
   user: {
     id: string
     username: string
     avatarUrl?: string
   }
   createdAt: string
 }
 
 interface OnlineUser {
   id: string
   username: string
   avatarUrl?: string
 }
 
 export function PublicChatPage() {
   const navigate = useNavigate()
   const { isLoggedIn, token, currentUser } = useUserStore()
   const [messages, setMessages] = useState<ChatMessage[]>([])
   const [inputValue, setInputValue] = useState('')
   const [connected, setConnected] = useState(false)
  const [, setOnlineUsers] = useState<OnlineUser[]>([])
   const [onlineCount, setOnlineCount] = useState(0)
   const [loading, setLoading] = useState(true)
   const messageListRef = useRef<HTMLDivElement>(null)
  const stickToBottomRef = useRef(false)
  const forceScrollToBottomRef = useRef(false)
  const restoredScrollRef = useRef(false)
  const scrollStorageKey = 'public-chat-scroll-top'

  const updateStickToBottom = () => {
    const el = messageListRef.current
    if (!el) return
    const thresholdPx = 80
    const distanceToBottom = el.scrollHeight - el.scrollTop - el.clientHeight
    stickToBottomRef.current = distanceToBottom <= thresholdPx
  }

  const scrollToBottom = () => {
    const el = messageListRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }

  // 记录滚动位置 + 是否贴底
  useEffect(() => {
    const el = messageListRef.current
    if (!el) return

    const onScroll = () => {
      updateStickToBottom()
      sessionStorage.setItem(scrollStorageKey, String(el.scrollTop))
    }

    el.addEventListener('scroll', onScroll, { passive: true })
    updateStickToBottom()

    return () => {
      el.removeEventListener('scroll', onScroll)
    }
  }, [])
 
   // 加载历史消息
   useEffect(() => {
     async function loadHistory() {
       try {
        const res = await fetch('/api/public-chat/messages')
        const data = await res.json()
        if (data.code === 200) {
          setMessages(Array.isArray(data.data) ? data.data : [])
        }
       } catch (error) {
         console.error('加载历史消息失败:', error)
       } finally {
         setLoading(false)
       }
     }
     loadHistory()
   }, [])

  // 刷新后恢复滚动位置（避免自动跳到最底部）
  useEffect(() => {
    if (loading) return
    if (restoredScrollRef.current) return
    const el = messageListRef.current
    if (!el) return

    const saved = sessionStorage.getItem(scrollStorageKey)
    restoredScrollRef.current = true
    if (!saved) {
      updateStickToBottom()
      return
    }

    const savedTop = Number.parseInt(saved, 10)
    if (!Number.isFinite(savedTop)) {
      updateStickToBottom()
      return
    }

    const maxTop = Math.max(0, el.scrollHeight - el.clientHeight)
    el.scrollTop = Math.min(Math.max(0, savedTop), maxTop)
    updateStickToBottom()
  }, [loading])
 
   // 连接 Socket
   useEffect(() => {
     if (!isLoggedIn || !token) return
 
     const socket = connectSocket(token)
 
     socket.on('connect', () => {
       setConnected(true)
     })
 
     socket.on('disconnect', () => {
       setConnected(false)
     })
 
     socket.on('message:new', (msg: ChatMessage) => {
       setMessages(prev => [...prev, msg])
     })
 
     socket.on('users:online', (users: OnlineUser[]) => {
       setOnlineUsers(users)
       setOnlineCount(users.length)
     })
 
     socket.on('user:join', (data: { userId: string; username: string; onlineCount: number }) => {
       setOnlineCount(data.onlineCount)
       message.info(`${data.username} 加入了聊天室`)
     })
 
     socket.on('user:leave', (data: { userId: string; username: string; onlineCount: number }) => {
       setOnlineCount(data.onlineCount)
     })
 
     socket.on('message:error', (data: { message: string }) => {
       message.error(data.message)
     })
 
     return () => {
       disconnectSocket()
     }
   }, [isLoggedIn, token])
 
  // 新消息到来：仅当用户在底部时才跟随，避免刷新/阅读历史时跳动
  useEffect(() => {
    if (loading) return
    const shouldScroll = forceScrollToBottomRef.current || stickToBottomRef.current
    forceScrollToBottomRef.current = false
    if (shouldScroll) {
      scrollToBottom()
    }
  }, [loading, messages])
 
   const handleSend = () => {
     if (!inputValue.trim()) return
     const socket = getSocket()
     if (!socket?.connected) {
       message.error('未连接到服务器')
       return
     }
    forceScrollToBottomRef.current = true
     socket.emit('message:send', { content: inputValue })
     setInputValue('')
   }
 
   const handleKeyPress = (e: React.KeyboardEvent) => {
     if (e.key === 'Enter' && !e.shiftKey) {
       e.preventDefault()
       handleSend()
     }
   }
 
   if (!isLoggedIn) {
     return (
       <div className={styles.notLoggedIn}>
         <p>请先登录后再进入聊天室</p>
         <Button type="primary" onClick={() => navigate('/login')}>
           去登录
         </Button>
       </div>
     )
   }
 
   return (
     <div className={styles.container}>
       <div className={styles.header}>
         <div className={styles.title}>
           <span>公共聊天室</span>
           <span className={styles.status}>
             {connected ? (
               <span className={styles.online}>在线</span>
             ) : (
               <span className={styles.offline}>离线</span>
             )}
           </span>
         </div>
         <div className={styles.onlineCount}>
           在线人数: {onlineCount}
         </div>
       </div>
 
       <div className={styles.messageList} ref={messageListRef}>
         {loading ? (
           <div className={styles.loading}>
             <Spin tip="加载中..." />
           </div>
         ) : messages.length === 0 ? (
           <div className={styles.empty}>暂无消息，快来说点什么吧~</div>
         ) : (
           messages.map(msg => {
             const isOwn = msg.userId === currentUser?.id
             return (
               <div
                 key={msg.id}
                 className={`${styles.messageItem} ${isOwn ? styles.own : ''}`}
               >
                 {!isOwn && (
                   <Avatar
                     src={msg.user.avatarUrl ? getImageUrl(msg.user.avatarUrl) : undefined}
                     className={styles.avatar}
                    style={{ cursor: 'pointer' }}
                    onClick={() => navigate(`/user/${msg.user?.id || msg.userId}`)}
                   >
                     {msg.user.username?.[0]?.toUpperCase()}
                   </Avatar>
                 )}
                 <div className={styles.messageContent}>
                   {!isOwn && (
                     <div className={styles.username}>{msg.user.username}</div>
                   )}
                   <div className={styles.bubble}>
                     {msg.content}
                   </div>
                   <div className={styles.time}>
                     {new Date(msg.createdAt).toLocaleTimeString()}
                   </div>
                 </div>
                 {isOwn && (
                   <Avatar
                     src={currentUser?.avatarUrl ? getImageUrl(currentUser.avatarUrl) : undefined}
                     className={styles.avatar}
                    style={{ cursor: 'pointer' }}
                    onClick={() => navigate(`/user/${msg.userId}`)}
                   >
                     {currentUser?.username?.[0]?.toUpperCase()}
                   </Avatar>
                 )}
               </div>
             )
           })
         )}
       </div>
 
       <div className={styles.inputArea}>
         <Input.TextArea
           value={inputValue}
           onChange={e => setInputValue(e.target.value)}
           onKeyDown={handleKeyPress}
           placeholder="输入消息..."
           autoSize={{ minRows: 1, maxRows: 4 }}
           className={styles.input}
         />
         <Button
           type="primary"
           icon={<SendOutlined />}
           onClick={handleSend}
           disabled={!connected || !inputValue.trim()}
         >
           发送
         </Button>
       </div>
     </div>
   )
 }
