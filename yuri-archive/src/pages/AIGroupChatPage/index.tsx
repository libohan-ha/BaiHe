import { ArrowLeftOutlined, PictureOutlined, PlusOutlined, SettingOutlined, TeamOutlined, UserOutlined } from '@ant-design/icons'
import { Avatar, Button, message, Modal, Slider, Spin, Tooltip, Upload } from 'antd'
import type { UploadProps } from 'antd'
import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ChatMarkdownRenderer } from '../../components'
import GroupMemberSelector from '../../components/GroupMemberSelector'
import {
  addGroupMember,
  getGroupChatMessages,
  getGroupMembers,
  getImageUrl,
  groupChatWithAI,
  sendGroupChatMessage,
  updateGroupConversationBackground,
  updateGroupConversationBubbleOpacity,
  uploadAIChatImage,
  type GroupChatMessage,
  type GroupMember,
} from '../../services/api'
import { useAIChatStore, useUserStore } from '../../store'
import { getApiConfig } from '../../utils/aiConfig'
import styles from './AIGroupChatPage.module.css'

export function AIGroupChatPage() {
  const { conversationId } = useParams<{ conversationId: string }>()
  const navigate = useNavigate()
  const { isLoggedIn, currentUser } = useUserStore()
  const { settings } = useAIChatStore()

  const [loading, setLoading] = useState(true)
  const [members, setMembers] = useState<GroupMember[]>([])
  const [messages, setMessages] = useState<GroupChatMessage[]>([])
  const [inputValue, setInputValue] = useState('')
  const [sending, setSending] = useState(false)
  const [memberSelectorOpen, setMemberSelectorOpen] = useState(false)

  // 背景图片状态
  const [backgroundUrl, setBackgroundUrl] = useState<string | null>(null)
  const [backgroundUploading, setBackgroundUploading] = useState(false)

  // 气泡透明度状态
  const [bubbleOpacity, setBubbleOpacity] = useState(85)
  const [settingsModalOpen, setSettingsModalOpen] = useState(false)

  // 流式响应状态
  const [streamingAIs, setStreamingAIs] = useState<Map<string, { content: string; name: string; avatarUrl: string | null }>>(new Map())
  const [waitingAIs, setWaitingAIs] = useState<Set<string>>(new Set())

  const chatAreaRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (loading) return
    if (window.innerWidth >= 768) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [loading])

  useEffect(() => {
    if (!isLoggedIn) {
      message.warning('请先登录')
      navigate('/login', { replace: true })
      return
    }
    if (conversationId) {
      loadConversation()
    }
  }, [conversationId, isLoggedIn])

  useEffect(() => {
    scrollToBottom()
  }, [messages, streamingAIs])

  const scrollToBottom = () => {
    if (chatAreaRef.current) {
      chatAreaRef.current.scrollTop = chatAreaRef.current.scrollHeight
    }
  }

  const loadConversation = async () => {
    setLoading(true)
    try {
      // 获取群聊成员和背景
      const { members: memberList, backgroundUrl: bgUrl, bubbleOpacity: opacity } = await getGroupMembers(conversationId!)
      setMembers(memberList)
      setBackgroundUrl(bgUrl)
      setBubbleOpacity(opacity ?? 85)

      // 获取群聊消息
      const msgList = await getGroupChatMessages(conversationId!)
      setMessages(msgList)
    } catch (err) {
      message.error(err instanceof Error ? err.message : '加载群聊失败')
      navigate('/ai-chat', { replace: true })
    } finally {
      setLoading(false)
    }
  }

  // 上传背景图片
  const handleBackgroundUpload: UploadProps['customRequest'] = async (options) => {
    const { file, onSuccess, onError } = options
    setBackgroundUploading(true)
    try {
      const result = await uploadAIChatImage(file as File, 'background')
      await updateGroupConversationBackground(conversationId!, result.url)
      setBackgroundUrl(result.url)
      onSuccess?.(result)
      message.success('背景图片设置成功')
    } catch (err) {
      onError?.(err as Error)
      message.error('上传失败')
    } finally {
      setBackgroundUploading(false)
    }
  }

  // 清除背景图片
  const handleClearBackground = async () => {
    Modal.confirm({
      title: '确认清除',
      content: '确定要清除聊天背景吗？',
      onOk: async () => {
        try {
          await updateGroupConversationBackground(conversationId!, null)
          setBackgroundUrl(null)
          message.success('背景已清除')
        } catch (err) {
          message.error(err instanceof Error ? err.message : '清除失败')
        }
      }
    })
  }

  // 保存气泡透明度
  const handleSaveBubbleOpacity = async (value: number) => {
    try {
      await updateGroupConversationBubbleOpacity(conversationId!, value)
      setBubbleOpacity(value)
      message.success('透明度已保存')
    } catch (err) {
      message.error(err instanceof Error ? err.message : '保存失败')
    }
  }

  // 气泡样式
  const getBubbleStyle = (role: 'user' | 'assistant') => {
    const opacity = bubbleOpacity / 100
    if (role === 'user') {
      return { backgroundColor: `rgba(192, 132, 252, ${opacity})` }
    }
    return { backgroundColor: `rgba(255, 255, 255, ${opacity})` }
  }

  const handleSend = async () => {
    if (!inputValue.trim() || sending || members.length === 0) return

    const userContent = inputValue.trim()
    setInputValue('')
    setSending(true)

    try {
      // 发送用户消息
      const userMsg = await sendGroupChatMessage(conversationId!, userContent)
      setMessages(prev => [...prev, userMsg])

      // 构建所有AI的API配置
      const apiConfigs: Record<string, { apiUrl: string; apiKey: string; model: string }> = {}
      for (const member of members) {
        const config = getApiConfig(settings, member.aiCharacter.modelName)
        if (config.apiKey) {
          apiConfigs[member.aiCharacter.id] = {
            apiUrl: config.url,
            apiKey: config.apiKey,
            model: config.model,
          }
        }
      }

      if (Object.keys(apiConfigs).length === 0) {
        message.warning('请先在AI聊天页面设置API Key')
        setSending(false)
        return
      }

      // 初始化等待状态 - 使用Set确保唯一性
      const uniqueAIIds = [...new Set(members.map(m => m.aiCharacter.id))]
      setWaitingAIs(new Set(uniqueAIIds))
      setStreamingAIs(new Map())

      // 调用群聊AI回复
      const response = await groupChatWithAI(conversationId!, apiConfigs)

      // 处理SSE流式响应
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (reader) {
        let buffer = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() || ''

          for (const line of lines) {
            if (line.startsWith('event: ')) {
              // 忽略事件类型行，只处理数据行
              continue
            }
            if (line.startsWith('data: ')) {
              const dataStr = line.slice(6).trim()
              if (!dataStr) continue

              try {
                const data = JSON.parse(dataStr)
                handleSSEEvent(data)
              } catch {
                // 忽略解析错误
              }
            }
          }
        }
      }

      // 重新加载消息以获取最终保存的消息
      const finalMessages = await getGroupChatMessages(conversationId!)
      setMessages(finalMessages)

    } catch (err) {
      message.error(err instanceof Error ? err.message : '发送失败')
    } finally {
      setSending(false)
      setWaitingAIs(new Set())
      setStreamingAIs(new Map())

      if (window.innerWidth >= 768) {
        setTimeout(() => inputRef.current?.focus(), 100)
      }
    }
  }

  const handleSSEEvent = (data: unknown) => {
    if (!data || typeof data !== 'object') return
    const obj = data as Record<string, unknown>

    const aiId = typeof obj.aiCharacterId === 'string' ? obj.aiCharacterId : null
    if (!aiId) return

    const aiName = typeof obj.aiName === 'string' ? obj.aiName : ''
    const errorMsg = typeof obj.error === 'string' ? obj.error : null
    const content = typeof obj.content === 'string' ? obj.content : null
    const avatarUrl = typeof obj.avatarUrl === 'string' ? obj.avatarUrl : (obj.avatarUrl === null ? null : undefined)

    if (errorMsg) {
      setWaitingAIs(prev => {
        const next = new Set(prev)
        next.delete(aiId)
        return next
      })
      message.error(aiName ? `${aiName}: ${errorMsg}` : errorMsg)
      return
    }

    if (content !== null) {
      setWaitingAIs(prev => {
        const next = new Set(prev)
        next.delete(aiId)
        return next
      })
      setStreamingAIs(prev => {
        const next = new Map(prev)
        const existing = next.get(aiId)
        next.set(aiId, {
          content: (existing?.content || '') + content,
          name: existing?.name || aiName,
          avatarUrl: existing?.avatarUrl ?? (avatarUrl === undefined ? null : avatarUrl),
        })
        return next
      })
      return
    }

    if (aiName && avatarUrl !== undefined) {
      setStreamingAIs(prev => {
        const next = new Map(prev)
        if (!next.has(aiId)) {
          next.set(aiId, {
            content: '',
            name: aiName,
            avatarUrl: avatarUrl,
          })
        }
        return next
      })
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleAddMember = async (selectedIds: string[]) => {
    try {
      for (const aiId of selectedIds) {
        await addGroupMember(conversationId!, aiId)
      }
      message.success('添加成员成功')
      // 重新加载成员列表
      const { members: memberList } = await getGroupMembers(conversationId!)
      setMembers(memberList)
    } catch (err) {
      message.error(err instanceof Error ? err.message : '添加成员失败')
    }
  }

  if (loading) {
    return (
      <div className={styles.container} style={{ justifyContent: 'center', alignItems: 'center' }}>
        <Spin size="large" />
      </div>
    )
  }

  return (
    <div className={styles.container}>
      {/* 头部 */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/ai-chat', { replace: true })}
            className={styles.backButton}
          />
          <TeamOutlined className={styles.groupIcon} />
          <span className={styles.title}>AI群聊</span>
        </div>
        <div className={styles.headerRight}>
          <div className={styles.memberAvatars}>
            {members.slice(0, 5).map(member => (
              <Tooltip key={member.id} title={member.aiCharacter.name}>
                <Avatar
                  size={28}
                  src={getImageUrl(member.aiCharacter.avatarUrl)}
                  icon={<UserOutlined />}
                  className={styles.memberAvatar}
                />
              </Tooltip>
            ))}
            {members.length > 5 && (
              <span className={styles.moreMembers}>+{members.length - 5}</span>
            )}
          </div>
          <Upload
            accept="image/*"
            showUploadList={false}
            customRequest={handleBackgroundUpload}
          >
            <Tooltip title={backgroundUrl ? '更换背景' : '设置背景'}>
              <Button
                type="text"
                icon={<PictureOutlined />}
                loading={backgroundUploading}
                className={styles.bgButton}
              />
            </Tooltip>
          </Upload>
          {backgroundUrl && (
            <Tooltip title="清除背景">
              <Button
                type="text"
                danger
                onClick={handleClearBackground}
                className={styles.clearBgButton}
              >
                ✕
              </Button>
            </Tooltip>
          )}
          <Tooltip title="气泡设置">
            <Button
              type="text"
              icon={<SettingOutlined />}
              onClick={() => setSettingsModalOpen(true)}
              className={styles.settingsButton}
            />
          </Tooltip>
          <Button
            type="text"
            icon={<PlusOutlined />}
            onClick={() => setMemberSelectorOpen(true)}
            className={styles.addMemberBtn}
          >
            添加成员
          </Button>
        </div>
      </div>

      {/* 聊天区域 */}
      <div
        className={styles.chatArea}
        ref={chatAreaRef}
        style={backgroundUrl ? { backgroundImage: `url(${getImageUrl(backgroundUrl)})` } : {}}
      >
        {messages.length === 0 && !sending ? (
          <div className={styles.emptyChat}>
            <TeamOutlined className={styles.emptyIcon} />
            <p>发送消息开始群聊吧！</p>
            <p className={styles.emptyHint}>所有AI成员都会回复你的消息</p>
          </div>
        ) : (
          <div className={styles.messagesContainer}>
            {messages.map(msg => (
              <div
                key={msg.id}
                className={`${styles.messageWrapper} ${msg.role === 'user' ? styles.user : styles.assistant}`}
              >
                {msg.role === 'user' ? (
                  <>
                    <Avatar
                      size={36}
                      src={getImageUrl(currentUser?.avatarUrl)}
                      icon={<UserOutlined />}
                    />
                    <div className={styles.messageBubble} style={getBubbleStyle('user')}>{msg.content}</div>
                  </>
                ) : (
                  <>
                    <Avatar
                      size={36}
                      src={getImageUrl(msg.aiCharacter?.avatarUrl)}
                      icon={<UserOutlined />}
                    />
                    <div className={styles.aiMessageContent}>
                      <span className={styles.aiName}>{msg.aiCharacter?.name || 'AI'}</span>
                      <div className={styles.messageBubble} style={getBubbleStyle('assistant')}>
                        <ChatMarkdownRenderer content={msg.content} />
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))}

            {/* 等待中的AI - 排除已经在流式输出中的AI */}
            {waitingAIs.size > 0 && (
              <div className={styles.waitingContainer}>
                {Array.from(waitingAIs)
                  .filter(aiId => !streamingAIs.has(aiId))
                  .map(aiId => {
                  const member = members.find(m => m.aiCharacter.id === aiId)
                  if (!member) return null
                  return (
                    <div key={aiId} className={`${styles.messageWrapper} ${styles.assistant}`}>
                      <Avatar
                        size={36}
                        src={getImageUrl(member.aiCharacter.avatarUrl)}
                        icon={<UserOutlined />}
                      />
                      <div className={styles.aiMessageContent}>
                        <span className={styles.aiName}>{member.aiCharacter.name}</span>
                        <div className={styles.messageBubble} style={getBubbleStyle('assistant')}>
                          <div className={styles.typing}>
                            <span></span>
                            <span></span>
                            <span></span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* 流式输出中的AI */}
            {streamingAIs.size > 0 && (
              <div className={styles.streamingContainer}>
                {Array.from(streamingAIs.entries()).map(([aiId, data]) => (
                  <div key={aiId} className={`${styles.messageWrapper} ${styles.assistant}`}>
                    <Avatar
                      size={36}
                      src={getImageUrl(data.avatarUrl)}
                      icon={<UserOutlined />}
                    />
                    <div className={styles.aiMessageContent}>
                      <span className={styles.aiName}>{data.name}</span>
                      <div className={styles.messageBubble} style={getBubbleStyle('assistant')}>
                        {data.content}
                        <span className={styles.cursor}>|</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 输入区域 */}
      <div className={styles.inputArea}>
        <div className={styles.inputContainer}>
          <textarea
            ref={inputRef}
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={members.length === 0 ? '请先添加AI成员' : '输入消息...'}
            disabled={sending || members.length === 0}
            className={styles.input}
            rows={1}
          />
          <Button
            type="primary"
            onClick={handleSend}
            disabled={!inputValue.trim() || sending || members.length === 0}
            loading={sending}
            className={styles.sendButton}
          >
            发送
          </Button>
        </div>
      </div>

      {/* 成员选择弹窗 */}
      <GroupMemberSelector
        open={memberSelectorOpen}
        onClose={() => setMemberSelectorOpen(false)}
        onConfirm={handleAddMember}
        excludeIds={members.map(m => m.aiCharacter.id)}
        title="添加AI成员"
        confirmText="添加"
      />

      {/* 气泡设置弹窗 */}
      <Modal
        title="气泡设置"
        open={settingsModalOpen}
        onCancel={() => setSettingsModalOpen(false)}
        footer={null}
        width={400}
      >
        <div style={{ padding: '16px 0' }}>
          <div style={{ marginBottom: 8 }}>气泡透明度</div>
          <Slider
            min={0}
            max={100}
            value={bubbleOpacity}
            onChange={setBubbleOpacity}
            onChangeComplete={handleSaveBubbleOpacity}
            marks={{ 0: '透明', 50: '半透明', 100: '不透明' }}
          />
          <div style={{ marginTop: 16, display: 'flex', gap: 16 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, color: '#999', marginBottom: 4 }}>用户气泡预览</div>
              <div style={{ 
                padding: '8px 12px', 
                borderRadius: 8,
                color: 'white',
                ...getBubbleStyle('user')
              }}>
                示例消息
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, color: '#999', marginBottom: 4 }}>AI气泡预览</div>
              <div style={{ 
                padding: '8px 12px', 
                borderRadius: 8,
                border: '1px solid #eee',
                ...getBubbleStyle('assistant')
              }}>
                示例消息
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  )
}
