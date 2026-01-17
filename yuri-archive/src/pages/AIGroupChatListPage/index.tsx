import { DeleteOutlined, EditOutlined, PlusOutlined, TeamOutlined } from '@ant-design/icons'
import { Avatar, Button, Input, message, Modal, Spin, Tooltip } from 'antd'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import GroupMemberSelector from '../../components/GroupMemberSelector'
import {
  createGroupConversation,
  deleteGroupConversation,
  getGroupConversations,
  getImageUrl,
  updateGroupConversationTitle,
  type GroupConversation,
} from '../../services/api'
import { useUserStore } from '../../store'
import styles from './AIGroupChatListPage.module.css'

export function AIGroupChatListPage() {
  const navigate = useNavigate()
  const { isLoggedIn } = useUserStore()

  const [loading, setLoading] = useState(true)
  const [conversations, setConversations] = useState<GroupConversation[]>([])
  const [createModalVisible, setCreateModalVisible] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState('')

  useEffect(() => {
    if (!isLoggedIn) {
      message.warning('请先登录')
      navigate('/login', { replace: true })
      return
    }
    loadConversations()
  }, [isLoggedIn])

  const loadConversations = async () => {
    setLoading(true)
    try {
      const convs = await getGroupConversations()
      setConversations(convs)
    } catch (err) {
      message.error(err instanceof Error ? err.message : '加载群聊列表失败')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (selectedIds: string[]) => {
    if (selectedIds.length < 1) {
      message.warning('请至少选择一个AI成员')
      return
    }
    try {
      const conv = await createGroupConversation('AI群聊', selectedIds)
      message.success('创建群聊成功')
      setCreateModalVisible(false)
      navigate(`/ai-group-chat/${conv.id}`)
    } catch (err) {
      message.error(err instanceof Error ? err.message : '创建群聊失败')
    }
  }

  const handleDelete = (convId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个群聊吗？删除后无法恢复。',
      okType: 'danger',
      onOk: async () => {
        try {
          await deleteGroupConversation(convId)
          message.success('删除成功')
          loadConversations()
        } catch (err) {
          message.error(err instanceof Error ? err.message : '删除失败')
        }
      }
    })
  }

  const handleStartEdit = (conv: GroupConversation, e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingId(conv.id)
    setEditingTitle(conv.title || 'AI群聊')
  }

  const handleSaveTitle = async (convId: string) => {
    if (!editingTitle.trim()) {
      setEditingId(null)
      return
    }
    try {
      await updateGroupConversationTitle(convId, editingTitle.trim())
      message.success('标题已更新')
      loadConversations()
    } catch (err) {
      message.error(err instanceof Error ? err.message : '更新失败')
    } finally {
      setEditingId(null)
    }
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditingTitle('')
  }

  const handleCardClick = (conv: GroupConversation) => {
    navigate(`/ai-group-chat/${conv.id}`)
  }

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (days === 0) {
      return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    } else if (days === 1) {
      return '昨天'
    } else if (days < 7) {
      return `${days}天前`
    } else {
      return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
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
        <div className={styles.titleSection}>
          <TeamOutlined className={styles.titleIcon} />
          <h2 className={styles.title}>AI 群聊</h2>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setCreateModalVisible(true)}
        >
          创建群聊
        </Button>
      </div>

      {/* 群聊列表 */}
      {conversations.length === 0 ? (
        <div className={styles.emptyState}>
          <TeamOutlined className={styles.emptyIcon} />
          <h3 className={styles.emptyTitle}>还没有群聊</h3>
          <p className={styles.emptyDesc}>创建一个群聊，让多个AI角色一起对话吧！</p>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setCreateModalVisible(true)}
          >
            创建群聊
          </Button>
        </div>
      ) : (
        <div className={styles.conversationList}>
          {conversations.map(conv => (
            <div
              key={conv.id}
              className={styles.conversationCard}
              onClick={() => handleCardClick(conv)}
            >
              <div className={styles.cardLeft}>
                <div className={styles.memberAvatars}>
                  {conv.members?.slice(0, 3).map((member, index) => (
                    <Avatar
                      key={member.id}
                      size={32}
                      src={getImageUrl(member.aiCharacter?.avatarUrl)}
                      className={styles.memberAvatar}
                      style={{ marginLeft: index > 0 ? -10 : 0 }}
                    />
                  ))}
                  {(conv.members?.length || 0) > 3 && (
                    <span className={styles.moreMembers}>+{conv.members!.length - 3}</span>
                  )}
                </div>
                <div className={styles.cardInfo}>
                  {editingId === conv.id ? (
                    <Input
                      value={editingTitle}
                      onChange={e => setEditingTitle(e.target.value)}
                      onBlur={() => handleSaveTitle(conv.id)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') handleSaveTitle(conv.id)
                        if (e.key === 'Escape') handleCancelEdit()
                      }}
                      onClick={e => e.stopPropagation()}
                      autoFocus
                      size="small"
                      className={styles.titleInput}
                    />
                  ) : (
                    <span className={styles.cardTitle}>{conv.title || 'AI群聊'}</span>
                  )}
                  <div className={styles.cardMeta}>
                    <span className={styles.memberNames}>
                      {conv.members?.slice(0, 3).map(m => m.aiCharacter?.name).join('、')}
                      {(conv.members?.length || 0) > 3 && '...'}
                    </span>
                    <span className={styles.messageCount}>
                      {conv._count?.messages || 0} 条消息
                    </span>
                  </div>
                </div>
              </div>
              <div className={styles.cardRight}>
                <span className={styles.updateTime}>{formatTime(conv.updatedAt)}</span>
                <div className={styles.cardActions}>
                  <Tooltip title="编辑标题">
                    <Button
                      type="text"
                      size="small"
                      icon={<EditOutlined />}
                      onClick={e => handleStartEdit(conv, e)}
                    />
                  </Tooltip>
                  <Tooltip title="删除">
                    <Button
                      type="text"
                      size="small"
                      icon={<DeleteOutlined />}
                      danger
                      onClick={e => handleDelete(conv.id, e)}
                    />
                  </Tooltip>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 创建群聊弹窗 */}
      <GroupMemberSelector
        open={createModalVisible}
        onClose={() => setCreateModalVisible(false)}
        onConfirm={handleCreate}
        title="创建群聊 - 选择AI成员"
        confirmText="创建群聊"
      />
    </div>
  )
}
