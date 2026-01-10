import React from 'react'
import { Button, Drawer, Input } from 'antd'
import { CheckOutlined, CloseOutlined, DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons'
import type { Conversation } from '../../../types'
import styles from '../AIChatRoomPage.module.css'

interface HistoryDrawerProps {
  visible: boolean
  onClose: () => void
  conversations: Conversation[]
  currentConversationId?: string
  onNewConversation: () => void
  onSwitchConversation: (conv: Conversation) => void
  onDeleteConversation: (convId: string, e: React.MouseEvent) => void
  // 编辑标题
  editingConvId: string | null
  editingTitle: string
  onStartEditTitle: (conv: Conversation, e: React.MouseEvent) => void
  onEditingTitleChange: (title: string) => void
  onSaveTitle: (convId: string) => void
  onCancelEdit: () => void
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  visible,
  onClose,
  conversations,
  currentConversationId,
  onNewConversation,
  onSwitchConversation,
  onDeleteConversation,
  editingConvId,
  editingTitle,
  onStartEditTitle,
  onEditingTitleChange,
  onSaveTitle,
  onCancelEdit,
}) => {
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

  return (
    <Drawer
      title="历史对话"
      placement="left"
      onClose={onClose}
      open={visible}
      width={320}
      className={styles.historyDrawer}
    >
      <div className={styles.historyHeader}>
        <Button type="primary" icon={<PlusOutlined />} onClick={onNewConversation} block>
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
              className={`${styles.historyItem} ${currentConversationId === conv.id ? styles.active : ''}`}
              onClick={() => editingConvId !== conv.id && onSwitchConversation(conv)}
            >
              <div className={styles.historyItemContent}>
                {editingConvId === conv.id ? (
                  <div className={styles.editTitleWrapper} onClick={e => e.stopPropagation()}>
                    <Input
                      size="small"
                      value={editingTitle}
                      onChange={e => onEditingTitleChange(e.target.value)}
                      onPressEnter={() => onSaveTitle(conv.id)}
                      onBlur={() => onSaveTitle(conv.id)}
                      autoFocus
                      className={styles.editTitleInput}
                    />
                    <Button
                      type="text"
                      size="small"
                      icon={<CheckOutlined />}
                      onClick={() => onSaveTitle(conv.id)}
                      className={styles.editTitleBtn}
                    />
                    <Button
                      type="text"
                      size="small"
                      icon={<CloseOutlined />}
                      onClick={onCancelEdit}
                      className={styles.editTitleBtn}
                    />
                  </div>
                ) : (
                  <>
                    <div className={styles.historyItemTitle}>
                      {conv.title || '新对话'}
                    </div>
                    <div className={styles.historyItemTime}>
                      {formatConversationTime(conv.updatedAt || conv.createdAt)}
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
                    onClick={(e) => onStartEditTitle(conv, e)}
                    className={styles.historyActionBtn}
                  />
                  <Button
                    type="text"
                    size="small"
                    icon={<DeleteOutlined />}
                    onClick={(e) => onDeleteConversation(conv.id, e)}
                    className={styles.historyActionBtn}
                    danger
                  />
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </Drawer>
  )
}
