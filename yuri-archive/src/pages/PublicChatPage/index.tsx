import { SendOutlined } from '@ant-design/icons'
import { Avatar, Button, Input, message, Spin } from 'antd'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChatMarkdownRenderer } from '../../components'
import { getAICharacters, getImageUrl } from '../../services/api'
import { connectSocket, disconnectSocket, getSocket } from '../../services/socket'
import { useAIChatStore, useUserStore } from '../../store'
import { getApiConfig } from '../../utils/aiConfig'
import styles from './PublicChatPage.module.css'

interface AICharacter {
  id: string
  name: string
  avatarUrl?: string
  modelName?: string
}

interface ChatMessage {
  id: string
  content: string
  imageUrl?: string
  userId?: string
  user?: {
    id: string
    username: string
    avatarUrl?: string
  }
  aiCharacterId?: string
  aiCharacter?: {
    id: string
    name: string
    avatarUrl?: string
  }
  createdAt: string
  isStreaming?: boolean
  streamingContent?: string
}

interface OnlineUser {
  id: string
  username: string
  avatarUrl?: string
}

export function PublicChatPage() {
  const navigate = useNavigate()
  const { isLoggedIn, token, currentUser } = useUserStore()
  const { settings } = useAIChatStore()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState('')
  const [connected, setConnected] = useState(false)
  const [, setOnlineUsers] = useState<OnlineUser[]>([])
  const [onlineCount, setOnlineCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [aiCharacters, setAICharacters] = useState<AICharacter[]>([])
  const [showAIList, setShowAIList] = useState(false)
  const [aiListFilter, setAIListFilter] = useState('')
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

  // 加载用户的 AI 角色列表
  const loadAICharacters = async () => {
    try {
      const chars = await getAICharacters()
      setAICharacters(chars)
    } catch (error) {
      console.error('加载AI角色失败:', error)
    }
  }

  // 记录滚动位置
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
    loadAICharacters()
  }, [])

  // 刷新后恢复滚动位置
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

    // AI 开始打字
    socket.on('ai:typing', (data: { aiCharacterId: string; aiName: string; aiAvatarUrl?: string; tempId: string }) => {
      setMessages(prev => [...prev, {
        id: data.tempId,
        content: '',
        aiCharacterId: data.aiCharacterId,
        aiCharacter: { id: data.aiCharacterId, name: data.aiName, avatarUrl: data.aiAvatarUrl },
        createdAt: new Date().toISOString(),
        isStreaming: true,
        streamingContent: ''
      }])
      forceScrollToBottomRef.current = true
    })

    // AI 流式内容
    socket.on('ai:stream', (data: { tempId: string; content: string }) => {
      setMessages(prev => prev.map(msg =>
        msg.id === data.tempId
          ? { ...msg, streamingContent: (msg.streamingContent || '') + data.content }
          : msg
      ))
    })

    // AI 回复完成
    socket.on('ai:complete', (data: { tempId: string; message: ChatMessage }) => {
      setMessages(prev => prev.map(msg =>
        msg.id === data.tempId
          ? { ...data.message, isStreaming: false }
          : msg
      ))
    })

    // AI 错误
    socket.on('ai:error', (data: { tempId: string | null; error: string }) => {
      message.error(data.error)
      if (data.tempId) {
        setMessages(prev => prev.filter(msg => msg.id !== data.tempId))
      }
    })

    return () => {
      disconnectSocket()
    }
  }, [isLoggedIn, token])

  // 新消息到来时滚动
  useEffect(() => {
    if (loading) return
    const shouldScroll = forceScrollToBottomRef.current || stickToBottomRef.current
    forceScrollToBottomRef.current = false
    if (shouldScroll) {
      scrollToBottom()
    }
  }, [loading, messages])

  // 处理输入变化，检测 @
  const handleInputChange = (value: string) => {
    setInputValue(value)

    const lastAtIndex = value.lastIndexOf('@')
    if (lastAtIndex !== -1) {
      const afterAt = value.slice(lastAtIndex + 1)
      if (!afterAt.includes(' ')) {
        setShowAIList(true)
        setAIListFilter(afterAt.toLowerCase())
      } else {
        setShowAIList(false)
      }
    } else {
      setShowAIList(false)
    }
  }

  // 选择 AI
  const handleSelectAI = (ai: AICharacter) => {
    const newValue = inputValue.replace(/@[^\s]*$/, `@${ai.name} `)
    setInputValue(newValue)
    setShowAIList(false)
  }

  // 解析消息中 @ 的 AI
  const parseMentionedAIs = (content: string): AICharacter[] => {
    const mentionPattern = /@(\S+)/g
    const mentions = [...content.matchAll(mentionPattern)]
    const mentioned: AICharacter[] = []

    for (const match of mentions) {
      const aiName = match[1]
      const ai = aiCharacters.find(a => a.name === aiName)
      if (ai) {
        mentioned.push(ai)
      }
    }

    return mentioned
  }

  const handleSend = () => {
    if (!inputValue.trim()) return
    const socket = getSocket()
    if (!socket?.connected) {
      message.error('未连接到服务器')
      return
    }

    const mentionedAIs = parseMentionedAIs(inputValue)

    // 验证 @ 的 AI 是否存在
    const mentionPattern = /@(\S+)/g
    const mentions = [...inputValue.matchAll(mentionPattern)]
    for (const match of mentions) {
      const aiName = match[1]
      const ai = aiCharacters.find(a => a.name === aiName)
      if (!ai) {
        message.error(`AI "${aiName}" 不存在`)
        return
      }
    }

    // 验证 API Key 配置
    for (const ai of mentionedAIs) {
      const apiConfig = getApiConfig(settings, ai.modelName)
      if (!apiConfig.apiKey) {
        message.error(`请先配置 ${ai.name} 使用的模型的 API Key`)
        return
      }
    }

    forceScrollToBottomRef.current = true

    if (mentionedAIs.length > 0) {
      // 构建每个 AI 的 API 配置
      const apiConfigs: Record<string, { url: string; apiKey: string; model: string }> = {}
      for (const ai of mentionedAIs) {
        const config = getApiConfig(settings, ai.modelName)
        apiConfigs[ai.id] = { url: config.url, apiKey: config.apiKey, model: config.model }
      }

      socket.emit('ai:request', {
        content: inputValue,
        mentionedAIs: mentionedAIs.map(a => ({ id: a.id, name: a.name })),
        apiConfigs
      })
    } else {
      socket.emit('message:send', { content: inputValue })
    }

    setInputValue('')
    setShowAIList(false)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // 过滤 AI 列表
  const filteredAIList = aiCharacters.filter(ai =>
    ai.name.toLowerCase().includes(aiListFilter)
  )

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
            const isAI = !!msg.aiCharacterId
            const isOwn = !isAI && msg.userId === currentUser?.id

            return (
              <div
                key={msg.id}
                className={`${styles.messageItem} ${isOwn ? styles.own : ''}`}
              >
                {!isOwn && (
                  <Avatar
                    src={isAI
                      ? (msg.aiCharacter?.avatarUrl ? getImageUrl(msg.aiCharacter.avatarUrl) : undefined)
                      : (msg.user?.avatarUrl ? getImageUrl(msg.user.avatarUrl) : undefined)
                    }
                    className={styles.avatar}
                    style={{ cursor: 'pointer' }}
                    onClick={() => !isAI && navigate(`/user/${msg.user?.id || msg.userId}`)}
                  >
                    {isAI ? msg.aiCharacter?.name?.[0] : msg.user?.username?.[0]?.toUpperCase()}
                  </Avatar>
                )}
                <div className={styles.messageContent}>
                  {!isOwn && (
                    <div className={styles.username}>
                      {isAI ? msg.aiCharacter?.name : msg.user?.username}
                      {isAI && <span className={styles.aiTag}>AI</span>}
                    </div>
                  )}
                  <div className={styles.bubble}>
                    {msg.isStreaming ? (
                      msg.streamingContent ? (
                        <>
                          {msg.streamingContent}
                          <span className={styles.cursor}>|</span>
                        </>
                      ) : (
                        <div className={styles.typing}>
                          <span></span><span></span><span></span>
                        </div>
                      )
                    ) : (
                      isAI ? <ChatMarkdownRenderer content={msg.content} /> : msg.content
                    )}
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
        {showAIList && filteredAIList.length > 0 && (
          <div className={styles.aiListPopup}>
            {filteredAIList.map(ai => (
              <div
                key={ai.id}
                className={styles.aiListItem}
                onClick={() => handleSelectAI(ai)}
              >
                <Avatar
                  size="small"
                  src={ai.avatarUrl ? getImageUrl(ai.avatarUrl) : undefined}
                >
                  {ai.name[0]}
                </Avatar>
                <span>{ai.name}</span>
              </div>
            ))}
          </div>
        )}
        <Input.TextArea
          value={inputValue}
          onChange={e => handleInputChange(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="输入消息... 输入 @ 可以召唤你的 AI"
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
