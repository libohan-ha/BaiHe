import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Typography, Button, Input, Avatar, Spin, Empty, message, Popconfirm, Pagination } from 'antd'
import { UserOutlined, MessageOutlined, DeleteOutlined, SendOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/zh-cn'
import { getComments, createComment, deleteComment, getImageUrl } from '../../services/api'
import { useUserStore } from '../../store/userStore'
import type { User } from '../../types'
import styles from './CommentSection.module.css'

dayjs.extend(relativeTime)
dayjs.locale('zh-cn')

const { Title, Text, Paragraph } = Typography
const { TextArea } = Input

// 评论类型定义
interface Comment {
  id: string
  content: string
  articleId: string | null
  imageId: string | null
  userId: string
  user: User
  parentId: string | null
  replyToUser?: User | null  // 被回复的用户（二级以下评论才有）
  replies?: Comment[]
  createdAt: string
}

interface CommentSectionProps {
  articleId?: string
  imageId?: string
}

export function CommentSection({ articleId, imageId }: CommentSectionProps) {
  const navigate = useNavigate()
  // 构建评论目标对象
  const commentTarget = articleId ? { articleId } : { imageId }
  const { currentUser, isLoggedIn } = useUserStore()
  
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const pageSize = 10

  useEffect(() => {
    loadComments()
  }, [articleId, imageId, page])

  const loadComments = async () => {
    setLoading(true)
    try {
      const res = await getComments(commentTarget, page, pageSize)
      setComments(res.comments || [])
      setTotal(res.pagination?.total || 0)
    } catch (err) {
      message.error('加载评论失败')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitComment = async () => {
    if (!isLoggedIn) {
      message.warning('请先登录后再评论')
      return
    }
    
    if (!commentText.trim()) {
      message.warning('请输入评论内容')
      return
    }

    setSubmitting(true)
    try {
      await createComment(commentTarget, commentText.trim())
      message.success('评论发表成功')
      setCommentText('')
      setPage(1)
      loadComments()
    } catch (err) {
      message.error(err instanceof Error ? err.message : '评论失败')
    } finally {
      setSubmitting(false)
    }
  }

  const handleSubmitReply = async (parentId: string) => {
    if (!isLoggedIn) {
      message.warning('请先登录后再评论')
      return
    }
    
    if (!replyText.trim()) {
      message.warning('请输入回复内容')
      return
    }

    setSubmitting(true)
    try {
      await createComment(commentTarget, replyText.trim(), parentId)
      message.success('回复成功')
      setReplyText('')
      setReplyingTo(null)
      loadComments()
    } catch (err) {
      message.error(err instanceof Error ? err.message : '回复失败')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    try {
      await deleteComment(commentId)
      message.success('删除成功')
      loadComments()
    } catch (err) {
      message.error(err instanceof Error ? err.message : '删除失败')
    }
  }

  const canDelete = (comment: Comment) => {
    if (!currentUser) return false
    return currentUser.id === comment.userId || 
           currentUser.role === 'ADMIN' || 
           currentUser.role === 'SUPER_ADMIN'
  }

  const handleUserClick = (userId: string) => {
    navigate(`/user/${userId}`)
  }

  const renderComment = (comment: Comment, isReply = false) => (
    <div
      key={comment.id}
      className={`${styles.commentItem} ${isReply ? styles.replyItem : ''}`}
    >
      <Avatar
        src={getImageUrl(comment.user?.avatarUrl)}
        icon={<UserOutlined />}
        size={isReply ? 32 : 40}
        className={styles.avatar}
        style={{ cursor: 'pointer' }}
        onClick={() => handleUserClick(comment.userId)}
      />
      <div className={styles.commentContent}>
        <div className={styles.commentHeader}>
          <Text
            strong
            className={styles.username}
            style={{ cursor: 'pointer' }}
            onClick={() => handleUserClick(comment.userId)}
          >
            {comment.user?.username || '匿名用户'}
          </Text>
          <Text type="secondary" className={styles.time}>
            {dayjs(comment.createdAt).fromNow()}
          </Text>
        </div>
        <Paragraph className={styles.commentText}>
          {/* 如果有 replyToUser，显示"回复 @xxx：" */}
          {comment.replyToUser && (
            <Text type="secondary" className={styles.replyTo}>
              回复 <Text strong className={styles.replyToName}>@{comment.replyToUser.username}</Text>：
            </Text>
          )}
          {comment.content}
        </Paragraph>
        <div className={styles.commentActions}>
          <Button 
            type="text" 
            size="small"
            icon={<MessageOutlined />}
            onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
            className={styles.actionBtn}
          >
            回复
          </Button>
          {canDelete(comment) && (
            <Popconfirm
              title="确定删除这条评论吗？"
              onConfirm={() => handleDeleteComment(comment.id)}
              okText="确定"
              cancelText="取消"
            >
              <Button 
                type="text" 
                size="small"
                danger
                icon={<DeleteOutlined />}
                className={styles.actionBtn}
              >
                删除
              </Button>
            </Popconfirm>
          )}
        </div>
        
        {/* 回复输入框 */}
        {replyingTo === comment.id && (
          <div className={styles.replyForm}>
            <TextArea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder={`回复 @${comment.user?.username || '匿名用户'}...`}
              rows={2}
              maxLength={500}
              showCount
              className={styles.replyInput}
            />
            <div className={styles.replyActions}>
              <Button 
                size="small" 
                onClick={() => {
                  setReplyingTo(null)
                  setReplyText('')
                }}
              >
                取消
              </Button>
              <Button 
                type="primary" 
                size="small"
                icon={<SendOutlined />}
                loading={submitting}
                onClick={() => handleSubmitReply(comment.id)}
              >
                发送
              </Button>
            </div>
          </div>
        )}
        
        {/* 嵌套回复 */}
        {comment.replies && comment.replies.length > 0 && (
          <div className={styles.replies}>
            {comment.replies.map(reply => renderComment(reply, true))}
          </div>
        )}
      </div>
    </div>
  )

  return (
    <div className={styles.container}>
      <Title level={4} className={styles.title}>
        <MessageOutlined /> 评论 ({total})
      </Title>

      {/* 评论输入框 */}
      <div className={styles.commentForm}>
        {isLoggedIn ? (
          <>
            <div className={styles.formHeader}>
              <Avatar 
                src={getImageUrl(currentUser?.avatarUrl)} 
                icon={<UserOutlined />}
                size={40}
              />
              <Text strong>{currentUser?.username}</Text>
            </div>
            <TextArea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="写下你的评论..."
              rows={3}
              maxLength={500}
              showCount
              className={styles.commentInput}
            />
            <div className={styles.formFooter}>
              <Button 
                type="primary"
                icon={<SendOutlined />}
                loading={submitting}
                onClick={handleSubmitComment}
              >
                发表评论
              </Button>
            </div>
          </>
        ) : (
          <div className={styles.loginPrompt}>
            <Text type="secondary">请</Text>
            <Button type="link" href="/login">登录</Button>
            <Text type="secondary">后发表评论</Text>
          </div>
        )}
      </div>

      {/* 评论列表 */}
      <div className={styles.commentList}>
        {loading ? (
          <div className={styles.loading}>
            <Spin />
          </div>
        ) : comments.length === 0 ? (
          <Empty 
            description="暂无评论，快来抢沙发吧~" 
            className={styles.empty}
          />
        ) : (
          <>
            {comments.map(comment => renderComment(comment))}
            {total > pageSize && (
              <div className={styles.pagination}>
                <Pagination
                  current={page}
                  total={total}
                  pageSize={pageSize}
                  onChange={setPage}
                  showSizeChanger={false}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}