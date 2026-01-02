import {
  ArrowLeftOutlined,
  DeleteOutlined,
  EditOutlined,
  PlusOutlined, RobotOutlined,
  SendOutlined,
  UploadOutlined
} from '@ant-design/icons'
import type { UploadProps } from 'antd'
import { Avatar, Button, Form, Input, message, Modal, Select, Slider, Spin, Upload } from 'antd'
import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  createConversation,
  getAICharacterById,
  getChatMessages,
  getConversations,
  getImageUrl,
  saveAssistantMessage,
  sendChatMessage,
  updateAICharacter,
  uploadAIChatImage
} from '../../services/api'
import { useAIChatStore, useUserStore } from '../../store'
import type { AICharacter, ChatMessage, Conversation } from '../../types'
import styles from './AIChatRoomPage.module.css'

const DEEPSEEK_API_URL = 'https://api.deepseek.com/chat/completions'

// 判断模型是否是 Claude 模型
const isClaudeModel = (modelName: string) => {
  return modelName?.startsWith('claude')
}

// 获取 API 配置 - 根据角色选择的模型自动判断
const getApiConfig = (settings: any, characterModel?: string) => {
  // 优先根据角色模型判断使用哪个 API
  const useClaudeApi = characterModel ? isClaudeModel(characterModel) : (settings.provider === 'claude')
  
  if (useClaudeApi) {
    return {
      url: `${settings.claudeBaseUrl || 'http://127.0.0.1:8045/v1'}/chat/completions`,
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
  const [editModalVisible, setEditModalVisible] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState<string>('')
  const [userAvatarUrl, setUserAvatarUrl] = useState<string>('')
  const [backgroundUrl, setBackgroundUrl] = useState<string>('')
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [userAvatarUploading, setUserAvatarUploading] = useState(false)
  const [backgroundUploading, setBackgroundUploading] = useState(false)
  const [form] = Form.useForm()
  const chatAreaRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

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

  const scrollToBottom = () => {
    if (chatAreaRef.current) {
      chatAreaRef.current.scrollTop = chatAreaRef.current.scrollHeight
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
        await loadConversation(convs[0])
      } else {
        // 如果没有对话，自动创建一个新对话
        const newConv = await createConversation(characterId!)
        setConversations([newConv])
        setCurrentConversation(newConv)
        setMessages([])
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
    } catch (err) {
      message.error('创建对话失败')
    }
  }

  const handleSend = async () => {
    if (!inputValue.trim() || sending || !currentConversation) return
    
    // 获取 API 配置
    const apiConfig = getApiConfig(settings, character?.modelName)
    
    if (!apiConfig.apiKey) {
      const providerName = apiConfig.provider === 'claude' ? 'Claude' : 'DeepSeek'
      message.warning(`请先在AI聊天页面设置 ${providerName} API Key`)
      return
    }

    const userContent = inputValue.trim()
    setInputValue('')
    setSending(true)
    setStreamingContent('')

    try {
      // 保存用户消息
      const userMsg = await sendChatMessage(currentConversation.id, userContent)
      setMessages(prev => [...prev, userMsg])

      // 调用 AI API (支持 DeepSeek 和 Claude) - 启用流式响应
      const response = await fetch(apiConfig.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiConfig.apiKey}`
        },
        body: JSON.stringify({
          model: apiConfig.model,
          messages: [
            { role: 'system', content: character?.prompt || '你是一个友好的AI助手。' },
            ...messages.map(m => ({ role: m.role, content: m.content })),
            { role: 'user', content: userContent }
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
      // AI回复完成后自动聚焦输入框
      setTimeout(() => {
        inputRef.current?.focus()
      }, 100)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
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

      {/* 新建对话按钮 */}
      <div style={{ padding: '8px 20px', background: '#fff', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 14, color: '#666' }}>{character.name}</span>
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
                  className={styles.messageAvatar}
                />
                <div>
                  <div className={`${styles.messageBubble} ${styles[msg.role]}`} style={bubbleStyle(msg.role)}>
                    {msg.content}
                  </div>
                  <div className={styles.messageTime}>{formatTime(msg.createdAt)}</div>
                </div>
              </div>
            ))}
            {sending && (
              <div className={`${styles.messageWrapper} ${styles.assistant}`}>
                <Avatar size={36} src={getImageUrl(character.avatarUrl)} icon={<RobotOutlined />} />
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
            )}
          </div>
        )}
      </div>

      {/* 输入区域 */}
      <div className={styles.inputArea}>
        <div className={styles.inputContainer}>
          <div className={styles.inputWrapper}>
            <input
              ref={inputRef}
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="输入消息..."
              disabled={!currentConversation || sending}
            />
          </div>
          <button className={styles.sendButton} onClick={handleSend} disabled={!inputValue.trim() || sending || !currentConversation}>
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
    </div>
  )
}

