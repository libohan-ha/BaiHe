import {
  ArrowLeftOutlined,
  CheckOutlined,
  CloseOutlined,
  CopyOutlined,
  DeleteOutlined,
  EditOutlined,
  HistoryOutlined,
  PictureOutlined,
  PlusOutlined,
  ReloadOutlined,
  RobotOutlined,
  SendOutlined,
  UploadOutlined
} from '@ant-design/icons'
import type { UploadProps } from 'antd'
import { Avatar, Button, Drawer, Form, Input, message, Modal, Select, Slider, Spin, Upload } from 'antd'
import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ImagePreview } from '../../components'
import {
  compressImage,
  createConversation,
  deleteConversation,
  formatMessageWithImages,
  getAICharacterById,
  getChatMessages,
  getConversations,
  getImageUrl,
  regenerateAssistantMessage,
  saveAssistantMessage,
  sendChatMessage,
  updateAICharacter,
  updateConversation,
  uploadAIChatImage,
  uploadChatImage
} from '../../services/api'
import { useAIChatStore, useUserStore } from '../../store'
import type { AICharacter, ChatMessage, Conversation } from '../../types'
import styles from './AIChatRoomPage.module.css'

const DEEPSEEK_API_URL = 'https://api.deepseek.com/chat/completions'

// 判断模型是否是 Claude 模型
const isClaudeModel = (modelName: string) => {
  return modelName?.startsWith('claude')
}

/**
 * 修复本地地址问题
 * 当检测到 127.0.0.1 或 localhost 时，自动替换为当前访问的 hostname
 * 这样手机端也能正常访问代理服务
 */
const fixLocalUrl = (url: string): string => {
  if (!url) return url
  
  try {
    const urlObj = new URL(url)
    // 检测是否是本地地址
    if (urlObj.hostname === '127.0.0.1' || urlObj.hostname === 'localhost') {
      // 替换为当前页面的 hostname
      urlObj.hostname = window.location.hostname
      return urlObj.toString()
    }
    return url
  } catch {
    return url
  }
}

// 获取 API 配置 - 根据角色选择的模型自动判断
const getApiConfig = (settings: any, characterModel?: string) => {
  // 优先根据角色模型判断使用哪个 API
  const useClaudeApi = characterModel ? isClaudeModel(characterModel) : (settings.provider === 'claude')
  
  if (useClaudeApi) {
    const baseUrl = fixLocalUrl(settings.claudeBaseUrl || 'http://127.0.0.1:8045/v1')
    return {
      url: `${baseUrl}/chat/completions`,
      apiKey: settings.claudeApiKey || '',
      model: characterModel || settings.claudeModel || 'claude-opus-4-5-thinking',
      provider: 'claude' as const
    }
  }
  
  return {
    url: DEEPSEEK_API_URL,
    apiKey: settings.deepseekApiKey || settings.apiKey || '',
    model: characterModel || settings.deepseekModel || 'deepseek-chat',
    provider: 'deepseek' as const
  }
}

export function AIChatRoomPage() {
  const { characterId } = useParams<{ characterId: string }>()
  const navigate = useNavigate()
  const { isLoggedIn, currentUser } = useUserStore()
  const { settings } = useAIChatStore()
  
  const [character, setCharacter] = useState<AICharacter | null>(null)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [streamingContent, setStreamingContent] = useState('')
  const [selectedImages, setSelectedImages] = useState<string[]>([])  // 待发送的图片URL列表
  const [imageUploading, setImageUploading] = useState(false)
  const [regeneratingMessageId, setRegeneratingMessageId] = useState<string | null>(null)
  const [editModalVisible, setEditModalVisible] = useState(false)
  const [historyDrawerVisible, setHistoryDrawerVisible] = useState(false)
  const [editingConvId, setEditingConvId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string>('')
  const [userAvatarUrl, setUserAvatarUrl] = useState<string>('')
  const [backgroundUrl, setBackgroundUrl] = useState<string>('')
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [userAvatarUploading, setUserAvatarUploading] = useState(false)
  const [backgroundUploading, setBackgroundUploading] = useState(false)
  const [form] = Form.useForm()
  const chatAreaRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!isLoggedIn) {
      message.warning('请先登录')
      navigate('/login')
      return
    }
    if (characterId) {
      loadCharacter()
    }
  }, [characterId, isLoggedIn])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // 流式响应时也滚动到底部
  useEffect(() => {
    if (streamingContent) {
      scrollToBottom()
    }
  }, [streamingContent])

  const scrollToBottom = () => {
    if (chatAreaRef.current) {
      chatAreaRef.current.scrollTop = chatAreaRef.current.scrollHeight
    }
  }

  // 获取保存的对话ID
  const getSavedConversationId = () => {
    return localStorage.getItem(`ai-chat-conv-${characterId}`)
  }

  // 保存当前对话ID
  const saveConversationId = (convId: string) => {
    localStorage.setItem(`ai-chat-conv-${characterId}`, convId)
  }

  const loadCharacter = async () => {
    setLoading(true)
    try {
      const char = await getAICharacterById(characterId!)
      setCharacter(char)
      const convs = await getConversations(characterId!)
      setConversations(convs)
      if (convs.length > 0) {
        // 优先恢复之前的对话
        const savedConvId = getSavedConversationId()
        const savedConv = savedConvId ? convs.find(c => c.id === savedConvId) : null
        await loadConversation(savedConv || convs[0])
      } else {
        // 如果没有对话，自动创建一个新对话
        const newConv = await createConversation(characterId!)
        setConversations([newConv])
        setCurrentConversation(newConv)
        setMessages([])
        saveConversationId(newConv.id)
      }
    } catch (err) {
      message.error(err instanceof Error ? err.message : '加载失败')
      navigate('/ai-chat')
    } finally {
      setLoading(false)
    }
  }

  const loadConversation = async (conv: Conversation) => {
    setCurrentConversation(conv)
    saveConversationId(conv.id) // 保存当前对话ID
    try {
      const msgs = await getChatMessages(conv.id)
      setMessages(msgs)
    } catch (err) {
      message.error('加载对话失败')
    }
  }

  const handleNewConversation = async () => {
    try {
      const conv = await createConversation(characterId!)
      setConversations([conv, ...conversations])
      setCurrentConversation(conv)
      setMessages([])
      saveConversationId(conv.id) // 保存新对话ID
      setHistoryDrawerVisible(false) // 创建新对话后关闭抽屉
    } catch (err) {
      message.error('创建对话失败')
    }
  }

  // 切换到历史对话
  const handleSwitchConversation = async (conv: Conversation) => {
    await loadConversation(conv)
    setHistoryDrawerVisible(false)
  }

  // 删除对话
  const handleDeleteConversation = (convId: string, e: React.MouseEvent) => {
    e.stopPropagation() // 阻止事件冒泡，避免触发切换对话
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个对话吗？删除后无法恢复。',
      okType: 'danger',
      onOk: async () => {
        try {
          await deleteConversation(convId)
          const newConversations = conversations.filter(c => c.id !== convId)
          setConversations(newConversations)
          
          // 如果删除的是当前对话，切换到第一个对话或创建新对话
          if (currentConversation?.id === convId) {
            if (newConversations.length > 0) {
              await loadConversation(newConversations[0])
            } else {
              const newConv = await createConversation(characterId!)
              setConversations([newConv])
              setCurrentConversation(newConv)
              setMessages([])
            }
          }
          message.success('删除成功')
        } catch (err) {
          message.error('删除失败')
        }
      }
    })
  }

  // 开始编辑对话标题
  const handleStartEditTitle = (conv: Conversation, e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingConvId(conv.id)
    setEditingTitle(conv.title || '新对话')
  }

  // 保存对话标题
  const handleSaveTitle = async (convId: string) => {
    if (!editingTitle.trim()) {
      setEditingConvId(null)
      return
    }
    
    try {
      const updated = await updateConversation(convId, editingTitle.trim())
      setConversations(conversations.map(c => c.id === convId ? { ...c, title: updated.title } : c))
      if (currentConversation?.id === convId) {
        setCurrentConversation({ ...currentConversation, title: updated.title })
      }
      message.success('标题已更新')
    } catch (err) {
      message.error('更新失败')
    } finally {
      setEditingConvId(null)
    }
  }

  // 取消编辑
  const handleCancelEdit = () => {
    setEditingConvId(null)
    setEditingTitle('')
  }

  // 格式化对话时间
  const formatConversationTime = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) {
      return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    } else if (diffDays === 1) {
      return '昨天'
    } else if (diffDays < 7) {
      return `${diffDays}天前`
    } else {
      return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
    }
  }

  // 处理图片选择
  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setImageUploading(true)
    try {
      for (const file of Array.from(files)) {
        // 验证文件类型
        if (!file.type.startsWith('image/')) {
          message.warning('只支持上传图片文件')
          continue
        }

        // 压缩大图片
        const processedFile = await compressImage(file)

        // 上传到服务器
        const result = await uploadChatImage(processedFile)
        setSelectedImages(prev => [...prev, result.url])
      }
    } catch (err) {
      message.error('图片上传失败')
    } finally {
      setImageUploading(false)
      // 清空 input 以允许重复选择相同文件
      if (imageInputRef.current) {
        imageInputRef.current.value = ''
      }
    }
  }

  // 移除已选择的图片
  const handleRemoveImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index))
  }

  const handleSend = async () => {
    if ((!inputValue.trim() && selectedImages.length === 0) || sending || !currentConversation) return
    
    // 获取 API 配置
    const apiConfig = getApiConfig(settings, character?.modelName)
    
    if (!apiConfig.apiKey) {
      const providerName = apiConfig.provider === 'claude' ? 'Claude' : 'DeepSeek'
      message.warning(`请先在AI聊天页面设置 ${providerName} API Key`)
      return
    }

    const userContent = inputValue.trim()
    const imagesToSend = [...selectedImages]
    setInputValue('')
    setSelectedImages([])
    setSending(true)
    setStreamingContent('')

    try {
      // 保存用户消息（包含图片）
      const userMsg = await sendChatMessage(currentConversation.id, userContent, imagesToSend.length > 0 ? imagesToSend : undefined)
      setMessages(prev => [...prev, userMsg])

      // 构建多模态消息内容（只对最新消息处理图片）
      const formattedUserContent = await formatMessageWithImages(userContent, imagesToSend)

      // 通过后端代理调用 AI API - 避免 CORS 问题
      const token = localStorage.getItem('token')
      const response = await fetch('/api/ai-chat/proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({
          apiUrl: apiConfig.url,
          apiKey: apiConfig.apiKey,
          model: apiConfig.model,
          messages: [
            { role: 'system', content: character?.prompt || '你是一个友好的AI助手。' },
            // 历史消息不传图片
            ...messages.map(m => ({ role: m.role, content: m.content })),
            // 当前消息使用多模态格式
            { role: 'user', content: formattedUserContent }
          ],
          stream: true  // 启用流式响应
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error?.message || 'AI请求失败')
      }

      // 流式读取响应
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let fullContent = ''

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value, { stream: true })
          const lines = chunk.split('\n')

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6).trim()
              if (data === '[DONE]') continue

              try {
                const parsed = JSON.parse(data)
                const content = parsed.choices?.[0]?.delta?.content || ''
                if (content) {
                  fullContent += content
                  setStreamingContent(fullContent)
                }
              } catch {
                // 忽略解析错误
              }
            }
          }
        }
      }

      const aiContent = fullContent || '抱歉，我暂时无法回复。'

      // 保存AI回复
      const aiMsg = await saveAssistantMessage(currentConversation.id, aiContent)
      setMessages(prev => [...prev, aiMsg])
      setStreamingContent('')
    } catch (err) {
      message.error(err instanceof Error ? err.message : '发送失败')
      setStreamingContent('')
    } finally {
      setSending(false)
      // AI回复完成后自动聚焦输入框（仅PC端，移动端不自动聚焦避免弹出键盘）
      if (window.innerWidth >= 768) {
        setTimeout(() => {
          inputRef.current?.focus()
        }, 100)
      }
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Ctrl+Enter 或 Shift+Enter 换行
    if (e.key === 'Enter' && (e.ctrlKey || e.shiftKey)) {
      // 不阻止默认行为，允许换行
      return
    }
    // 单独按 Enter 发送消息
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSend()
    }
  }

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  }

  // 复制消息内容 - 使用 fallback 方法以支持非 HTTPS 环境
  const handleCopyMessage = async (content: string) => {
    try {
      // 优先使用现代 Clipboard API
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(content)
        message.success('已复制到剪贴板')
        return
      }
      
      // Fallback: 使用传统的 execCommand 方法（支持 HTTP 环境）
      const textArea = document.createElement('textarea')
      textArea.value = content
      // 避免滚动到底部
      textArea.style.position = 'fixed'
      textArea.style.left = '-9999px'
      textArea.style.top = '0'
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()
      
      const successful = document.execCommand('copy')
      document.body.removeChild(textArea)
      
      if (successful) {
        message.success('已复制到剪贴板')
      } else {
        message.error('复制失败')
      }
    } catch (err) {
      message.error('复制失败')
    }
  }

  // 获取最新的AI消息ID
  const getLatestAssistantMessageId = () => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'assistant') {
        return messages[i].id
      }
    }
    return null
  }

  // 重新生成AI回复
  const handleRegenerateMessage = async (messageId: string) => {
    if (regeneratingMessageId || sending || !currentConversation) return

    // 获取 API 配置
    const apiConfig = getApiConfig(settings, character?.modelName)
    
    if (!apiConfig.apiKey) {
      const providerName = apiConfig.provider === 'claude' ? 'Claude' : 'DeepSeek'
      message.warning(`请先在AI聊天页面设置 ${providerName} API Key`)
      return
    }

    // 立即清空该消息的内容，显示等待动画
    setMessages(prev => prev.map(msg =>
      msg.id === messageId ? { ...msg, content: '' } : msg
    ))
    setRegeneratingMessageId(messageId)
    setStreamingContent('')

    try {
      // 调用重新生成API
      const response = await regenerateAssistantMessage(
        currentConversation.id,
        messageId,
        {
          apiUrl: apiConfig.url,
          apiKey: apiConfig.apiKey,
          model: apiConfig.model
        }
      )

      // 流式读取响应
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let fullContent = ''

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value, { stream: true })
          const lines = chunk.split('\n')

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6).trim()
              if (data === '[DONE]') continue

              try {
                const parsed = JSON.parse(data)
                const content = parsed.choices?.[0]?.delta?.content || ''
                if (content) {
                  fullContent += content
                  setStreamingContent(fullContent)
                }
              } catch {
                // 忽略解析错误
              }
            }
          }
        }
      }

      // 更新本地消息列表
      if (fullContent) {
        setMessages(prev => prev.map(msg =>
          msg.id === messageId ? { ...msg, content: fullContent } : msg
        ))
      }
      setStreamingContent('')
    } catch (err) {
      message.error(err instanceof Error ? err.message : '重新生成失败')
      setStreamingContent('')
    } finally {
      setRegeneratingMessageId(null)
    }
  }

  const openEditModal = () => {
    if (character) {
      form.setFieldsValue({
        name: character.name,
        prompt: character.prompt,
        modelName: character.modelName || 'deepseek-chat',
        bubbleOpacity: character.bubbleOpacity ?? 85
      })
      setAvatarUrl(character.avatarUrl || '')
      setUserAvatarUrl(character.userAvatarUrl || '')
      setBackgroundUrl(character.backgroundUrl || '')
      setEditModalVisible(true)
    }
  }

  const handleEditSubmit = async (values: any) => {
    try {
      const data = {
        ...values,
        avatarUrl: avatarUrl || undefined,
        userAvatarUrl: userAvatarUrl || undefined,
        backgroundUrl: backgroundUrl || undefined,
      }
      const updated = await updateAICharacter(characterId!, data)
      setCharacter(updated)
      message.success('保存成功')
      setEditModalVisible(false)
    } catch (err) {
      message.error('保存失败')
    }
  }

  // 上传角色头像
  const handleAvatarUpload: UploadProps['customRequest'] = async (options) => {
    const { file, onSuccess, onError } = options
    setAvatarUploading(true)
    try {
      const result = await uploadAIChatImage(file as File, 'avatar')
      setAvatarUrl(result.url)
      onSuccess?.(result)
      message.success('角色头像上传成功')
    } catch (err) {
      onError?.(err as Error)
      message.error('上传失败')
    } finally {
      setAvatarUploading(false)
    }
  }

  // 上传用户头像
  const handleUserAvatarUpload: UploadProps['customRequest'] = async (options) => {
    const { file, onSuccess, onError } = options
    setUserAvatarUploading(true)
    try {
      const result = await uploadAIChatImage(file as File, 'avatar')
      setUserAvatarUrl(result.url)
      onSuccess?.(result)
      message.success('用户头像上传成功')
    } catch (err) {
      onError?.(err as Error)
      message.error('上传失败')
    } finally {
      setUserAvatarUploading(false)
    }
  }

  // 上传背景图片
  const handleBackgroundUpload: UploadProps['customRequest'] = async (options) => {
    const { file, onSuccess, onError } = options
    setBackgroundUploading(true)
    try {
      const result = await uploadAIChatImage(file as File, 'background')
      setBackgroundUrl(result.url)
      onSuccess?.(result)
      message.success('背景图片上传成功')
    } catch (err) {
      onError?.(err as Error)
      message.error('上传失败')
    } finally {
      setBackgroundUploading(false)
    }
  }

  const handleDeleteCharacter = () => {
    Modal.confirm({
      title: '确认删除',
      content: '删除角色将同时删除所有对话记录，确定要删除吗？',
      okType: 'danger',
      onOk: async () => {
        try {
          const { deleteAICharacter } = await import('../../services/api')
          await deleteAICharacter(characterId!)
          message.success('删除成功')
          navigate('/ai-chat')
        } catch (err) {
          message.error('删除失败')
        }
      }
    })
  }

  const bubbleStyle = (role: 'user' | 'assistant') => {
    const opacity = (character?.bubbleOpacity ?? 85) / 100
    if (role === 'user') {
      return { backgroundColor: `rgba(82, 196, 26, ${opacity})` }
    }
    return { backgroundColor: `rgba(255, 255, 255, ${opacity})` }
  }

  if (loading) {
    return (
      <div className={styles.container} style={{ justifyContent: 'center', alignItems: 'center' }}>
        <Spin size="large" />
      </div>
    )
  }

  if (!character) return null

  return (
    <div className={styles.container}>
      {/* 头部 */}
      <div className={styles.chatHeader}>
        <div className={styles.headerLeft}>
          <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate('/ai-chat')} className={styles.backButton} />
          <div className={styles.characterInfo}>
            <Avatar size={40} src={getImageUrl(character.avatarUrl)} icon={<RobotOutlined />} />
            <div>
              <h3 className={styles.characterName}>{character.name}</h3>
              <span className={styles.characterStatus}>在线</span>
            </div>
          </div>
        </div>
        <div className={styles.headerRight}>
          <Button type="text" icon={<EditOutlined />} onClick={openEditModal} />
          <Button type="text" icon={<DeleteOutlined />} onClick={handleDeleteCharacter} danger />
        </div>
      </div>

      {/* 对话操作栏 */}
      <div className={styles.conversationBar}>
        <Button
          type="text"
          icon={<HistoryOutlined />}
          onClick={() => setHistoryDrawerVisible(true)}
          className={styles.historyButton}
        >
          历史对话 ({conversations.length})
        </Button>
        <Button size="small" icon={<PlusOutlined />} onClick={handleNewConversation}>新建对话</Button>
      </div>

      {/* 聊天区域 */}
      <div
        className={styles.chatArea}
        ref={chatAreaRef}
        style={character.backgroundUrl ? { backgroundImage: `url(${getImageUrl(character.backgroundUrl)})` } : {}}
      >
        {!currentConversation ? (
          <div className={styles.emptyChat}>
            <div className={styles.emptyIcon}>💬</div>
            <p>点击"新建对话"开始聊天</p>
          </div>
        ) : messages.length === 0 ? (
          <div className={styles.emptyChat}>
            <div className={styles.emptyIcon}>👋</div>
            <p>发送消息开始对话吧！</p>
          </div>
        ) : (
          <div className={styles.messagesContainer}>
            {messages.map(msg => (
              <div key={msg.id} className={`${styles.messageWrapper} ${styles[msg.role]}`}>
                <Avatar
                  size={36}
                  src={getImageUrl(msg.role === 'user' ? (character.userAvatarUrl || currentUser?.avatarUrl) : character.avatarUrl)}
                  icon={msg.role === 'user' ? null : <RobotOutlined />}
                  className={msg.id === regeneratingMessageId ? styles.streamingAvatar : styles.messageAvatar}
                />
                <div className={styles.messageContent}>
                  <div className={`${styles.messageBubble} ${styles[msg.role]}`} style={bubbleStyle(msg.role)}>
                    {/* 显示消息中的图片 - 点击弹窗预览 */}
                    {msg.images && msg.images.length > 0 && (
                      <div className={styles.messageImages}>
                        {msg.images.map((imgUrl, idx) => (
                          <ImagePreview
                            key={idx}
                            src={imgUrl}
                            alt={`图片 ${idx + 1}`}
                            className={styles.messageImage}
                          />
                        ))}
                      </div>
                    )}
                    {/* 重新生成时显示等待动画或流式内容 */}
                    {msg.id === regeneratingMessageId ? (
                      streamingContent ? (
                        <>
                          {streamingContent}
                          <span className={styles.cursor}>|</span>
                        </>
                      ) : (
                        <div className={styles.typing}><span></span><span></span><span></span></div>
                      )
                    ) : (
                      msg.content
                    )}
                  </div>
                  <div className={`${styles.messageFooter} ${styles[msg.role]}`}>
                    <span className={styles.messageTime}>{formatTime(msg.createdAt)}</span>
                    <button
                      className={styles.copyButton}
                      onClick={() => handleCopyMessage(msg.content)}
                      title="复制"
                    >
                      <CopyOutlined />
                    </button>
                    {/* 只有最新的AI回复显示重新生成按钮 */}
                    {msg.role === 'assistant' && msg.id === getLatestAssistantMessageId() && !sending && !regeneratingMessageId && (
                      <button
                        className={styles.regenerateButton}
                        onClick={() => handleRegenerateMessage(msg.id)}
                        title="重新生成"
                      >
                        <ReloadOutlined />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {/* 只有发送新消息时才显示新的等待气泡 */}
            {sending && (
              <div className={`${styles.messageWrapper} ${styles.assistant}`}>
                <Avatar
                  size={36}
                  src={getImageUrl(character.avatarUrl)}
                  icon={<RobotOutlined />}
                  className={styles.streamingAvatar}
                />
                <div>
                  <div className={`${styles.messageBubble} ${styles.assistant}`} style={bubbleStyle('assistant')}>
                    {streamingContent ? (
                      <>
                        {streamingContent}
                        <span className={styles.cursor}>|</span>
                      </>
                    ) : (
                      <div className={styles.typing}><span></span><span></span><span></span></div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 输入区域 */}
      <div className={styles.inputArea}>
        {/* 已选择的图片预览 */}
        {selectedImages.length > 0 && (
          <div className={styles.selectedImagesPreview}>
            {selectedImages.map((imgUrl, idx) => (
              <div key={idx} className={styles.previewImageWrapper}>
                <img src={getImageUrl(imgUrl)} alt={`预览 ${idx + 1}`} className={styles.previewImage} />
                <button
                  className={styles.removeImageBtn}
                  onClick={() => handleRemoveImage(idx)}
                  type="button"
                >
                  <CloseOutlined />
                </button>
              </div>
            ))}
          </div>
        )}
        <div className={styles.inputContainer}>
          {/* 隐藏的文件输入 */}
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            multiple
            style={{ display: 'none' }}
            onChange={handleImageSelect}
          />
          {/* 图片上传按钮 */}
          <button
            className={styles.actionButton}
            onClick={() => imageInputRef.current?.click()}
            disabled={!currentConversation || sending || imageUploading}
            type="button"
          >
            {imageUploading ? <Spin size="small" /> : <PictureOutlined style={{ fontSize: 20, color: '#666' }} />}
          </button>
          <div className={styles.inputWrapper}>
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={selectedImages.length > 0 ? "添加说明（可选）... (Ctrl+Enter 换行)" : "输入消息... (Ctrl+Enter 换行)"}
              disabled={!currentConversation || sending}
              rows={1}
            />
          </div>
          <button
            className={styles.sendButton}
            onClick={handleSend}
            disabled={(!inputValue.trim() && selectedImages.length === 0) || sending || !currentConversation}
          >
            <SendOutlined style={{ color: '#fff', fontSize: 18 }} />
          </button>
        </div>
      </div>

      {/* 编辑角色弹窗 */}
      <Modal title="编辑角色" open={editModalVisible} onCancel={() => setEditModalVisible(false)} footer={null} width={600}>
        <p style={{ color: '#666', marginBottom: 16 }}>编辑角色的信息和设置。</p>
        <Form form={form} layout="vertical" onFinish={handleEditSubmit}>
          <Form.Item name="name" label="角色名称" rules={[{ required: true }]}>
            <Input />
          </Form.Item>

          {/* 图片上传区域 */}
          <div className={styles.uploadSection}>
            <div className={styles.uploadItem}>
              <div className={styles.uploadLabel}>角色头像</div>
              <Upload
                accept="image/*"
                showUploadList={false}
                customRequest={handleAvatarUpload}
              >
                <div className={styles.uploadBox}>
                  {avatarUrl ? (
                    <Avatar size={80} src={getImageUrl(avatarUrl)} />
                  ) : (
                    <div className={styles.uploadPlaceholder}>
                      {avatarUploading ? <Spin size="small" /> : <UploadOutlined />}
                      <span>上传头像</span>
                    </div>
                  )}
                </div>
              </Upload>
            </div>

            <div className={styles.uploadItem}>
              <div className={styles.uploadLabel}>用户头像</div>
              <Upload
                accept="image/*"
                showUploadList={false}
                customRequest={handleUserAvatarUpload}
              >
                <div className={styles.uploadBox}>
                  {userAvatarUrl ? (
                    <Avatar size={80} src={getImageUrl(userAvatarUrl)} />
                  ) : (
                    <div className={styles.uploadPlaceholder}>
                      {userAvatarUploading ? <Spin size="small" /> : <UploadOutlined />}
                      <span>上传头像</span>
                    </div>
                  )}
                </div>
              </Upload>
              <div className={styles.uploadHint}>聊天时显示的你的头像</div>
            </div>

            <div className={styles.uploadItem}>
              <div className={styles.uploadLabel}>聊天背景</div>
              <Upload
                accept="image/*"
                showUploadList={false}
                customRequest={handleBackgroundUpload}
              >
                <div className={styles.uploadBoxWide}>
                  {backgroundUrl ? (
                    <img src={getImageUrl(backgroundUrl)} alt="背景" className={styles.backgroundPreview} />
                  ) : (
                    <div className={styles.uploadPlaceholder}>
                      {backgroundUploading ? <Spin size="small" /> : <UploadOutlined />}
                      <span>上传背景图片</span>
                    </div>
                  )}
                </div>
              </Upload>
            </div>
          </div>

          <Form.Item name="prompt" label="角色提示词" rules={[{ required: true }]}>
            <Input.TextArea rows={4} />
          </Form.Item>

          <Form.Item name="modelName" label="AI 模型" initialValue="deepseek-chat">
            <Select>
              <Select.Option value="deepseek-chat">DeepSeek</Select.Option>
              <Select.Option value="claude-opus-4-5-thinking">Claude</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item name="bubbleOpacity" label="气泡透明度">
            <Slider min={0} max={100} marks={{ 0: '透明', 50: '半透明', 100: '不透明' }} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>保存</Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* 历史对话抽屉 */}
      <Drawer
        title="历史对话"
        placement="left"
        onClose={() => setHistoryDrawerVisible(false)}
        open={historyDrawerVisible}
        width={320}
        className={styles.historyDrawer}
      >
        <div className={styles.historyHeader}>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleNewConversation} block>
            新建对话
          </Button>
        </div>
        <div className={styles.historyList}>
          {conversations.length === 0 ? (
            <div className={styles.emptyHistory}>
              <p>暂无历史对话</p>
            </div>
          ) : (
            conversations.map(conv => (
              <div
                key={conv.id}
                className={`${styles.historyItem} ${currentConversation?.id === conv.id ? styles.active : ''}`}
                onClick={() => editingConvId !== conv.id && handleSwitchConversation(conv)}
              >
                <div className={styles.historyItemContent}>
                  {editingConvId === conv.id ? (
                    <div className={styles.editTitleWrapper} onClick={e => e.stopPropagation()}>
                      <Input
                        size="small"
                        value={editingTitle}
                        onChange={e => setEditingTitle(e.target.value)}
                        onPressEnter={() => handleSaveTitle(conv.id)}
                        onBlur={() => handleSaveTitle(conv.id)}
                        autoFocus
                        className={styles.editTitleInput}
                      />
                      <Button
                        type="text"
                        size="small"
                        icon={<CheckOutlined />}
                        onClick={() => handleSaveTitle(conv.id)}
                        className={styles.editTitleBtn}
                      />
                      <Button
                        type="text"
                        size="small"
                        icon={<CloseOutlined />}
                        onClick={handleCancelEdit}
                        className={styles.editTitleBtn}
                      />
                    </div>
                  ) : (
                    <>
                      <div className={styles.historyItemTitle}>{conv.title || '新对话'}</div>
                      <div className={styles.historyItemMeta}>
                        <span className={styles.historyItemTime}>{formatConversationTime(conv.updatedAt)}</span>
                        {conv._count && <span className={styles.historyItemCount}>{conv._count.messages} 条消息</span>}
                      </div>
                    </>
                  )}
                </div>
                {editingConvId !== conv.id && (
                  <div className={styles.historyItemActions}>
                    <Button
                      type="text"
                      size="small"
                      icon={<EditOutlined />}
                      onClick={(e) => handleStartEditTitle(conv, e)}
                      className={styles.historyItemEdit}
                    />
                    <Button
                      type="text"
                      size="small"
                      icon={<DeleteOutlined />}
                      onClick={(e) => handleDeleteConversation(conv.id, e)}
                      className={styles.historyItemDelete}
                      danger
                    />
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </Drawer>
    </div>
  )
}

