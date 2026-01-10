import {
  ArrowLeftOutlined,
  DeleteOutlined,
  EditOutlined,
  HistoryOutlined,
  PlusOutlined,
  RobotOutlined,
} from '@ant-design/icons'
import type { UploadProps } from 'antd'
import { Avatar, Button, Form, message, Modal, Spin } from 'antd'
import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useChat, useImageUpload, useConversation } from './hooks'
import { HistoryDrawer, InputArea, EditCharacterModal, MessageBubble } from './components'
import {
  editAndRegenerateMessage,
  formatMessageWithImages,
  getAICharacterById,
  getChatMessages,
  getConversations,
  getImageUrl,
  regenerateAssistantMessage,
  saveAssistantMessage,
  sendChatMessage,
  updateAICharacter,
  uploadAIChatImage,
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
  const {
    settings,
    streamingContent,
    streamingConversationId,
    streamingMessageId,
    isStreaming,
    setStreamingState,
    appendStreamingContent,
    resetStreaming
  } = useAIChatStore()
  
  const [character, setCharacter] = useState<AICharacter | null>(null)
  const [loading, setLoading] = useState(true)

  // 使用 useConversation hook
  const {
    conversations,
    setConversations,
    currentConversation,
    messages,
    setMessages,
    switchConversation,
    createNewConversation,
    deleteConv,
    updateTitle,
  } = useConversation(characterId || '')
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

  // 使用 useChat hook
  const {
    inputValue,
    setInputValue,
    sending,
    setSending,
    regeneratingMessageId,
    setRegeneratingMessageId,
    editingMessageId,
    setEditingMessageId,
    editingMessageContent,
    setEditingMessageContent,
    startEditMessage,
    cancelEditMessage,
    getLatestAssistantMessageId,
  } = useChat()

  // 使用 useImageUpload hook
  const {
    selectedImages,
    setSelectedImages,
    imageUploading,
    handleImageUpload,
    handleRemoveImage,
  } = useImageUpload()

  const chatAreaRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const isNearBottomRef = useRef(true) // 跟踪用户是否在底部附近
  const abortControllerRef = useRef<AbortController | null>(null) // 用于取消流式请求
  const streamingContentRef = useRef<string>('') // 保存流式内容的引用
  const currentConversationRef = useRef<Conversation | null>(null) // 保存当前对话的引用
  const isSendingNewMessageRef = useRef(false) // 标记是否正在发送新消息（vs 重新生成）

  // 同步 streamingContent 到 ref
  useEffect(() => {
    streamingContentRef.current = streamingContent
  }, [streamingContent])

  // 同步 currentConversation 到 ref
  useEffect(() => {
    currentConversationRef.current = currentConversation
  }, [currentConversation])

  useEffect(() => {
    if (!isLoggedIn) {
      message.warning('请先登录')
      navigate('/login', { replace: true })
      return
    }
    if (characterId) {
      loadCharacter()
    }

    // 组件卸载时的清理
    return () => {
      // 取消正在进行的流式请求
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      
      // 如果有正在进行的流式内容且是发送新消息，保存到后端
      if (streamingContentRef.current && currentConversationRef.current && isSendingNewMessageRef.current) {
        // 使用同步方式尝试保存（不等待结果）
        saveAssistantMessage(currentConversationRef.current.id, streamingContentRef.current).catch(() => {
          // 忽略保存错误
        })
      }
    }
  }, [characterId, isLoggedIn])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // 流式响应时也滚动到底部（仅当用户在底部附近时）
  useEffect(() => {
    if (streamingContent && streamingConversationId === currentConversation?.id) {
      scrollToBottom()
    }
  }, [streamingContent])

  // 跨路由保留流式状态：恢复发送禁用/显示动画
  useEffect(() => {
    if (isStreaming && streamingConversationId === currentConversation?.id) {
      setSending(true)
    }
  }, [isStreaming])

  // 监听滚动事件，判断用户是否在底部附近
  useEffect(() => {
    const chatArea = chatAreaRef.current
    if (!chatArea) return

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = chatArea
      // 距离底部150px以内视为"在底部附近"
      const threshold = 150
      isNearBottomRef.current = scrollHeight - scrollTop - clientHeight < threshold
    }

    // 初始化时检查一次滚动位置
    handleScroll()

    chatArea.addEventListener('scroll', handleScroll, { passive: true })
    return () => chatArea.removeEventListener('scroll', handleScroll)
  }, [loading, messages.length]) // 当加载完成或消息数量变化时重新绑定

  // 智能滚动：只有当用户在底部附近时才自动滚动
  const scrollToBottom = () => {
    if (chatAreaRef.current && isNearBottomRef.current) {
      chatAreaRef.current.scrollTop = chatAreaRef.current.scrollHeight
    }
  }

  // 强制滚动到底部（用于发送新消息后）
  const forceScrollToBottom = () => {
    if (chatAreaRef.current) {
      chatAreaRef.current.scrollTop = chatAreaRef.current.scrollHeight
      isNearBottomRef.current = true
    }
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
        const savedConvId = localStorage.getItem(`ai-chat-conv-${characterId}`)
        const savedConv = savedConvId ? convs.find(c => c.id === savedConvId) : null
        await switchConversation(savedConv || convs[0])
      } else {
        // 如果没有对话，自动创建一个新对话
        await createNewConversation()
      }
    } catch (err) {
      message.error(err instanceof Error ? err.message : '加载失败')
      navigate('/ai-chat', { replace: true })
    } finally {
      setLoading(false)
    }
  }

  const handleNewConversation = async () => {
    try {
      await createNewConversation()
      setHistoryDrawerVisible(false) // 创建新对话后关闭抽屉
    } catch (err) {
      message.error('创建对话失败')
    }
  }

  // 切换到历史对话
  const handleSwitchConversation = async (conv: Conversation) => {
    if (streamingConversationId && streamingConversationId !== conv.id) {
      resetStreaming()
      setRegeneratingMessageId(null)
      setSending(false)
    }
    await switchConversation(conv)
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
          resetStreaming()
          setRegeneratingMessageId(null)
          setStreamingState({ isStreaming: false, conversationId: null, messageId: null })
          await deleteConv(convId)
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
      await updateTitle(convId, editingTitle.trim())
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

  // 处理图片选择 - 包装 useImageUpload 的方法
  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    try {
      await handleImageUpload(Array.from(files))
    } catch (err) {
      message.error('图片上传失败')
    } finally {
      // 清空 input 以允许重复选择相同文件
      if (imageInputRef.current) {
        imageInputRef.current.value = ''
      }
    }
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
    setStreamingState({ content: '', conversationId: currentConversation.id, isStreaming: true })

    try {
      // 发送消息时强制滚动到底部
      forceScrollToBottom()
      
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
                  appendStreamingContent(content)
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
      resetStreaming()
    } catch (err) {
      // 如果是用户取消请求，不显示错误
      if (err instanceof Error && err.name === 'AbortError') {
        // 请求被取消
        return
      }
      message.error(err instanceof Error ? err.message : '发送失败')
      resetStreaming()
    } finally {
      setSending(false)
      setStreamingState({ isStreaming: false, conversationId: null, messageId: null })
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

  // 处理粘贴事件 - 支持从剪贴板粘贴图片
  const handlePaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items
    if (!items) return

    const imageItems: DataTransferItem[] = []
    for (const item of Array.from(items)) {
      if (item.type.startsWith('image/')) {
        imageItems.push(item)
      }
    }

    // 如果没有图片，让默认的文本粘贴行为继续
    if (imageItems.length === 0) return

    // 有图片时阻止默认行为，处理图片上传
    e.preventDefault()

    try {
      const files: File[] = []
      for (const item of imageItems) {
        const file = item.getAsFile()
        if (file) files.push(file)
      }
      await handleImageUpload(files)
      message.success('图片已添加')
    } catch (err) {
      message.error('图片上传失败')
    }
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
    setStreamingState({ content: '', conversationId: currentConversation.id, messageId, isStreaming: true })

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
                  appendStreamingContent(content)
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
      resetStreaming()
    } catch (err) {
      message.error(err instanceof Error ? err.message : '重新生成失败')
      resetStreaming()
    } finally {
      setRegeneratingMessageId(null)
      setSending(false)
      setStreamingState({ isStreaming: false, conversationId: null, messageId: null })
    }
  }

  // 提交编辑消息并重新生成AI回复
  const handleSubmitEditMessage = async () => {
    if (!editingMessageId || !editingMessageContent.trim() || !currentConversation) return
    if (sending || regeneratingMessageId) return

    // 获取 API 配置
    const apiConfig = getApiConfig(settings, character?.modelName)
    
    if (!apiConfig.apiKey) {
      const providerName = apiConfig.provider === 'claude' ? 'Claude' : 'DeepSeek'
      message.warning(`请先在AI聊天页面设置 ${providerName} API Key`)
      return
    }

    const messageId = editingMessageId
    const newContent = editingMessageContent.trim()
    
    // 清除编辑状态
    setEditingMessageId(null)
    setEditingMessageContent('')
    
    // 找到编辑的消息在列表中的位置，截断后面的消息并更新内容
    const messageIndex = messages.findIndex(m => m.id === messageId)
    if (messageIndex === -1) return
    
    // 截断消息列表并更新编辑的消息内容
    const truncatedMessages = messages.slice(0, messageIndex + 1).map(m =>
      m.id === messageId ? { ...m, content: newContent } : m
    )
    setMessages(truncatedMessages)
    
    // 设置发送状态（显示等待动画）
    setSending(true)
    setStreamingState({ content: '', conversationId: currentConversation.id, isStreaming: true })

    try {
      // 调用编辑并重新生成API
      const response = await editAndRegenerateMessage(
        currentConversation.id,
        messageId,
        newContent,
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
                  appendStreamingContent(content)
                }
              } catch {
                // 忽略解析错误
              }
            }
          }
        }
      }

      // 重新加载对话以获取最新消息（包括新的AI回复）
      const msgs = await getChatMessages(currentConversation.id)
      setMessages(msgs)
      resetStreaming()
    } catch (err) {
      message.error(err instanceof Error ? err.message : '编辑并重新生成失败')
      // 失败时重新加载消息
      try {
        const msgs = await getChatMessages(currentConversation.id)
        setMessages(msgs)
      } catch {
        // 忽略
      }
      resetStreaming()
    } finally {
      setSending(false)
      setStreamingState({ isStreaming: false, conversationId: null })
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
          navigate('/ai-chat', { replace: true })
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
          <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate('/ai-chat', { replace: true })} className={styles.backButton} />
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
              <MessageBubble
                key={msg.id}
                message={msg}
                isUser={msg.role === 'user'}
                avatarUrl={msg.role === 'user' ? (character.userAvatarUrl || currentUser?.avatarUrl) : character.avatarUrl}
                bubbleStyle={bubbleStyle(msg.role)}
                isStreamingThis={isStreaming && streamingConversationId === currentConversation?.id && streamingMessageId === msg.id}
                streamingContent={streamingContent}
                isRegenerating={isStreaming && msg.id === regeneratingMessageId}
                isEditing={msg.id === editingMessageId}
                editingContent={editingMessageContent}
                onEditingContentChange={setEditingMessageContent}
                onSubmitEdit={handleSubmitEditMessage}
                onCancelEdit={cancelEditMessage}
                onCopy={() => handleCopyMessage(msg.content)}
                onEdit={() => startEditMessage(msg)}
                onRegenerate={() => handleRegenerateMessage(msg.id)}
                canEdit={!sending && !regeneratingMessageId && !editingMessageId}
                canRegenerate={!sending && !regeneratingMessageId && !editingMessageId}
                isLatestAssistant={msg.id === getLatestAssistantMessageId(messages)}
              />
            ))}
            {/* 只有发送新消息时才显示新的等待气泡 */}
            {sending && !streamingMessageId && !regeneratingMessageId && (
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
      <InputArea
        inputValue={inputValue}
        onInputChange={setInputValue}
        onSend={handleSend}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        onImageSelect={handleImageSelect}
        onRemoveImage={handleRemoveImage}
        selectedImages={selectedImages}
        disabled={!currentConversation}
        sending={sending}
        imageUploading={imageUploading}
        inputRef={inputRef}
      />

      {/* 编辑角色弹窗 */}
      <EditCharacterModal
        visible={editModalVisible}
        onClose={() => setEditModalVisible(false)}
        form={form}
        onSubmit={handleEditSubmit}
        avatarUrl={avatarUrl}
        avatarUploading={avatarUploading}
        onAvatarUpload={handleAvatarUpload}
        userAvatarUrl={userAvatarUrl}
        userAvatarUploading={userAvatarUploading}
        onUserAvatarUpload={handleUserAvatarUpload}
        backgroundUrl={backgroundUrl}
        backgroundUploading={backgroundUploading}
        onBackgroundUpload={handleBackgroundUpload}
      />

      {/* 历史对话抽屉 */}
      <HistoryDrawer
        visible={historyDrawerVisible}
        onClose={() => setHistoryDrawerVisible(false)}
        conversations={conversations}
        currentConversationId={currentConversation?.id}
        onNewConversation={handleNewConversation}
        onSwitchConversation={handleSwitchConversation}
        onDeleteConversation={handleDeleteConversation}
        editingConvId={editingConvId}
        editingTitle={editingTitle}
        onStartEditTitle={handleStartEditTitle}
        onEditingTitleChange={setEditingTitle}
        onSaveTitle={handleSaveTitle}
        onCancelEdit={handleCancelEdit}
      />
    </div>
  )
}

