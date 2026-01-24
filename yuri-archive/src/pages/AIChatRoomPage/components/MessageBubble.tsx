import React, { memo } from 'react'
import { Avatar } from 'antd'
import {
  CheckOutlined,
  CloseOutlined,
  CopyOutlined,
  EditOutlined,
  ReloadOutlined,
  RobotOutlined,
} from '@ant-design/icons'
import { ChatMarkdownRenderer, ImagePreview } from '../../../components'
import { getImageUrl } from '../../../services/api'
import type { ChatMessage } from '../../../types'
import styles from '../AIChatRoomPage.module.css'

interface MessageBubbleProps {
  message: ChatMessage
  isUser: boolean
  avatarUrl?: string
  bubbleStyle?: React.CSSProperties
  // 流式状态
  isStreamingThis?: boolean
  streamingContent?: string
  isRegenerating?: boolean
  // 编辑状态
  isEditing?: boolean
  editingContent?: string
  onEditingContentChange?: (content: string) => void
  onSubmitEdit?: () => void
  onCancelEdit?: () => void
  // 操作
  onCopyMessage?: (content: string) => void
  onEditMessage?: (message: ChatMessage) => void
  onRegenerateMessage?: (messageId: string) => void
  // 权限控制
  canEdit?: boolean
  canRegenerate?: boolean
  isLatestAssistant?: boolean
}

export const MessageBubble = memo(function MessageBubble({
  message,
  isUser,
  avatarUrl,
  bubbleStyle,
  isStreamingThis = false,
  streamingContent = '',
  isRegenerating = false,
  isEditing = false,
  editingContent = '',
  onEditingContentChange,
  onSubmitEdit,
  onCancelEdit,
  onCopyMessage,
  onEditMessage,
  onRegenerateMessage,
  canEdit = false,
  canRegenerate = false,
  isLatestAssistant = false,
}: MessageBubbleProps) {
  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.shiftKey)) {
      return
    }
    if (e.key === 'Enter') {
      e.preventDefault()
      onSubmitEdit?.()
    }
  }

  const renderContent = () => {
    // 编辑模式
    if (isEditing) {
      return (
        <div className={styles.editMessageWrapper}>
          <textarea
            className={styles.editMessageInput}
            value={editingContent}
            onChange={e => onEditingContentChange?.(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
            rows={3}
            placeholder="回车发送，Ctrl+Enter 换行"
          />
          <div className={styles.editMessageActions}>
            <button
              className={styles.editMessageBtn}
              onClick={onSubmitEdit}
              disabled={!editingContent.trim()}
            >
              <CheckOutlined /> 提交
            </button>
            <button
              className={styles.editMessageCancelBtn}
              onClick={onCancelEdit}
            >
              <CloseOutlined /> 取消
            </button>
          </div>
        </div>
      )
    }

    // 流式输出中
    if (isStreamingThis) {
      if (streamingContent) {
        return (
          <>
            {streamingContent}
            <span className={styles.cursor}>|</span>
          </>
        )
      }
      return <div className={styles.typing}><span></span><span></span><span></span></div>
    }

    // 重新生成中
    if (isRegenerating) {
      return <div className={styles.typing}><span></span><span></span><span></span></div>
    }

    // 正常显示内容
    if (!isUser) {
      return <ChatMarkdownRenderer content={message.content} />
    }

    return message.content
  }

  return (
    <div className={`${styles.messageWrapper} ${styles[message.role]}`}>
      <Avatar
        size={36}
        src={getImageUrl(avatarUrl)}
        icon={isUser ? null : <RobotOutlined />}
        className={isStreamingThis ? styles.streamingAvatar : styles.messageAvatar}
      />
      <div className={styles.messageContent}>
        <div className={`${styles.messageBubble} ${styles[message.role]}`} style={bubbleStyle}>
          {/* 显示消息中的图片 */}
          {message.images && message.images.length > 0 && (
            <div className={styles.messageImages}>
              {message.images.map((imgUrl, idx) => (
                <ImagePreview
                  key={idx}
                  src={imgUrl}
                  alt={`图片 ${idx + 1}`}
                  className={styles.messageImage}
                />
              ))}
            </div>
          )}
          {renderContent()}
        </div>
        <div className={`${styles.messageFooter} ${styles[message.role]}`}>
          <span className={styles.messageTime}>{formatTime(message.createdAt)}</span>
          <button
            className={styles.copyButton}
            onClick={() => onCopyMessage?.(message.content)}
            title="复制"
          >
            <CopyOutlined />
          </button>
          {/* 用户消息显示编辑按钮 */}
          {isUser && canEdit && (
            <button
              className={styles.editMessageButton}
              onClick={() => onEditMessage?.(message)}
              title="编辑消息"
            >
              <EditOutlined />
            </button>
          )}
          {/* 只有最新的AI回复显示重新生成按钮 */}
          {!isUser && isLatestAssistant && canRegenerate && (
            <button
              className={styles.regenerateButton}
              onClick={() => onRegenerateMessage?.(message.id)}
              title="重新生成"
            >
              <ReloadOutlined />
            </button>
          )}
        </div>
      </div>
    </div>
  )
})
