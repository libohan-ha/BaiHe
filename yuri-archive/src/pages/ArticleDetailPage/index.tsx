import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Typography, Tag, Avatar, Button, Space, Breadcrumb, Spin, message, Popconfirm } from 'antd'
import { HeartOutlined, HeartFilled, ArrowLeftOutlined, EyeOutlined, ClockCircleOutlined, UserOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { MarkdownRenderer, CommentSection, ImagePreview } from '../../components'
import { getArticleById, addCollection, removeCollection, getCollections, deleteArticle, getImageUrl } from '../../services/api'
import { useUserStore } from '../../store'
import type { Article } from '../../types'
import styles from './ArticleDetailPage.module.css'

const { Title } = Typography

export function ArticleDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [article, setArticle] = useState<Article | null>(null)
  const [loading, setLoading] = useState(true)
  const [collected, setCollected] = useState(false)
  const [collectionId, setCollectionId] = useState<string | null>(null)
  const [collectLoading, setCollectLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const { isLoggedIn, currentUser } = useUserStore()

  // 判断是否是作者
  const isAuthor = currentUser && article && (currentUser.id === article.authorId || currentUser.id === article.author?.id)

  useEffect(() => {
    if (id) {
      loadArticle(id)
      if (isLoggedIn) {
        checkCollection(id)
      }
    }
  }, [id, isLoggedIn])

  const loadArticle = async (articleId: string) => {
    setLoading(true)
    try {
      const data = await getArticleById(articleId)
      setArticle(data)
    } catch (err) {
      message.error(err instanceof Error ? err.message : '文章不存在')
      navigate('/')
    } finally {
      setLoading(false)
    }
  }

  const checkCollection = async (articleId: string) => {
    try {
      const res = await getCollections(1, 100)
      const found = res.data.find(a => a.id === articleId)
      if (found && 'collectionId' in found) {
        setCollected(true)
        setCollectionId((found as any).collectionId)
      }
    } catch {
      // 忽略错误
    }
  }

  const handleCollect = async () => {
    if (!isLoggedIn) {
      message.warning('请先登录')
      navigate('/login')
      return
    }
    if (!id) return

    setCollectLoading(true)
    try {
      if (collected && collectionId) {
        await removeCollection(collectionId)
        setCollected(false)
        setCollectionId(null)
        message.success('已取消收藏')
      } else {
        const res = await addCollection(id)
        setCollected(true)
        setCollectionId(res.id)
        message.success('收藏成功')
      }
    } catch (err) {
      message.error(err instanceof Error ? err.message : '操作失败')
    } finally {
      setCollectLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!id) return
    setDeleteLoading(true)
    try {
      await deleteArticle(id)
      message.success('删除成功')
      navigate('/user')
    } catch (err) {
      message.error(err instanceof Error ? err.message : '删除失败')
    } finally {
      setDeleteLoading(false)
    }
  }

  if (loading) {
    return (
      <div className={styles.loading}>
        <Spin size="large" />
      </div>
    )
  }

  if (!article) {
    return null
  }

  return (
    <div className={styles.container}>
      <Breadcrumb
        className={styles.breadcrumb}
        items={[
          { title: <Link to="/">首页</Link> },
          { title: article.title },
        ]}
      />

      <article className={styles.article}>
        {article.coverUrl && (
          <div className={styles.cover}>
            <ImagePreview
              src={article.coverUrl}
              alt={article.title}
              className={styles.coverImage}
            />
          </div>
        )}

        <header className={styles.header}>
          <Title level={1} className={styles.title}>{article.title}</Title>
          
          <div className={styles.meta}>
            <Link to={`/user/${article.author?.id || article.authorId}`} className={styles.author}>
              <Avatar
                src={getImageUrl(article.author?.avatarUrl)}
                icon={<UserOutlined />}
                size="small"
              />
              <span>{article.author?.username || '匿名'}</span>
            </Link>
            
            <Space className={styles.stats}>
              <span><ClockCircleOutlined /> {dayjs(article.createdAt).format('YYYY-MM-DD')}</span>
              <span><EyeOutlined /> {article.views} 阅读</span>
            </Space>
          </div>

          <div className={styles.tags}>
            {article.tags?.map(tag => (
              <Tag
                key={tag.id}
                color="purple"
                onClick={() => navigate(`/tag/${tag.id}`)}
                style={{ cursor: 'pointer' }}
              >
                {tag.name}
              </Tag>
            ))}
          </div>
        </header>

        <div className={styles.content}>
          <MarkdownRenderer content={article.content} />
        </div>

        {/* 评论区 */}
        <CommentSection articleId={id!} />

        <footer className={styles.footer}>
          <Space size="middle">
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate(-1)}
            >
              返回
            </Button>
            <Button
              type={collected ? 'primary' : 'default'}
              icon={collected ? <HeartFilled /> : <HeartOutlined />}
              onClick={handleCollect}
              loading={collectLoading}
            >
              {collected ? '已收藏' : '收藏'}
            </Button>
            {isAuthor && (
              <>
                <Button
                  icon={<EditOutlined />}
                  onClick={() => navigate(`/edit/${id}`)}
                >
                  编辑
                </Button>
                <Popconfirm
                  title="确定删除这篇文章吗？"
                  description="删除后无法恢复"
                  onConfirm={handleDelete}
                  okText="确定"
                  cancelText="取消"
                >
                  <Button
                    danger
                    icon={<DeleteOutlined />}
                    loading={deleteLoading}
                  >
                    删除
                  </Button>
                </Popconfirm>
              </>
            )}
          </Space>
        </footer>
      </article>
    </div>
  )
}
