import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Typography,
  Button,
  Tag,
  Avatar,
  Spin,
  message,
  Modal,
  Popconfirm,
  Empty,
} from 'antd'
import {
  ArrowLeftOutlined,
  HeartOutlined,
  HeartFilled,
  EditOutlined,
  DeleteOutlined,
  UserOutlined,
  CalendarOutlined,
  LockOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import { 
  getPrivateImageById, 
  deletePrivateImage, 
  addPrivateImageCollection, 
  removePrivateImageCollection,
  checkPrivateImageCollection,
  getImageUrl 
} from '../../services/api'
import { useUserStore } from '../../store/userStore'
import type { PrivateImage } from '../../types'
import styles from './PrivateImageDetailPage.module.css'

const { Title, Text, Paragraph } = Typography

export function PrivateImageDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { currentUser, isLoggedIn } = useUserStore()
  
  const [image, setImage] = useState<PrivateImage | null>(null)
  const [loading, setLoading] = useState(true)
  const [isCollected, setIsCollected] = useState(false)
  const [collectionId, setCollectionId] = useState<string | null>(null)
  const [collectLoading, setCollectLoading] = useState(false)
  const [previewVisible, setPreviewVisible] = useState(false)

  useEffect(() => {
    if (!isLoggedIn) {
      message.warning('请先登录')
      navigate('/login')
      return
    }
    if (id) {
      loadImage()
      checkCollection()
    }
  }, [id, isLoggedIn, navigate])

  const loadImage = async () => {
    if (!id) return
    setLoading(true)
    try {
      const data = await getPrivateImageById(id)
      setImage(data)
    } catch (err) {
      message.error(err instanceof Error ? err.message : '加载图片失败')
      navigate('/private-gallery')
    } finally {
      setLoading(false)
    }
  }

  const checkCollection = async () => {
    if (!id) return
    try {
      const result = await checkPrivateImageCollection(id)
      setIsCollected(result.collected)
      setCollectionId(result.collectionId)
    } catch {
      // 忽略错误
    }
  }

  const handleCollect = async () => {
    if (!id) return

    setCollectLoading(true)
    try {
      if (isCollected && collectionId) {
        await removePrivateImageCollection(collectionId)
        setIsCollected(false)
        setCollectionId(null)
        message.success('已取消收藏')
      } else {
        const res = await addPrivateImageCollection(id)
        setIsCollected(true)
        setCollectionId(res.id)
        message.success('收藏成功')
      }
    } catch (err) {
      message.error(err instanceof Error ? err.message : '操作失败')
    } finally {
      setCollectLoading(false)
    }
  }

  const handleEdit = () => {
    navigate(`/edit-private-image/${id}`)
  }

  const handleDelete = async () => {
    if (!id) return
    try {
      await deletePrivateImage(id)
      message.success('删除成功')
      navigate('/private-gallery')
    } catch (err) {
      message.error(err instanceof Error ? err.message : '删除失败')
    }
  }

  const handleBack = () => {
    navigate(-1)
  }

  const handleTagClick = (tagId: string) => {
    navigate(`/private-gallery?tag=${tagId}`)
  }

  if (!isLoggedIn) {
    return (
      <div className={styles.container}>
        <Empty
          image={<LockOutlined style={{ fontSize: 64, color: '#d9d9d9' }} />}
          description="请先登录查看隐私相册"
        >
          <Button type="primary" onClick={() => navigate('/login')}>
            去登录
          </Button>
        </Empty>
      </div>
    )
  }

  if (loading) {
    return (
      <div className={styles.loading}>
        <Spin size="large" />
      </div>
    )
  }

  if (!image) {
    return null
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={handleBack}
          className={styles.backButton}
        >
          返回
        </Button>
        <div className={styles.privateTag}>
          <LockOutlined /> 私密图片
        </div>
        <div className={styles.actions}>
          <Button
            type={isCollected ? 'primary' : 'default'}
            icon={isCollected ? <HeartFilled /> : <HeartOutlined />}
            onClick={handleCollect}
            loading={collectLoading}
            className={isCollected ? styles.collectedButton : ''}
          >
            {isCollected ? '已收藏' : '收藏'}
          </Button>
          <Button
            type="default"
            icon={<EditOutlined />}
            onClick={handleEdit}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这张图片吗？"
            description="删除后无法恢复"
            onConfirm={handleDelete}
            okText="确定"
            cancelText="取消"
          >
            <Button
              type="default"
              danger
              icon={<DeleteOutlined />}
            >
              删除
            </Button>
          </Popconfirm>
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.imageSection}>
          <div 
            className={styles.imageWrapper}
            onClick={() => setPreviewVisible(true)}
          >
            <img
              src={getImageUrl(image.imageUrl)}
              alt={image.title}
              className={styles.mainImage}
            />
          </div>
        </div>

        <div className={styles.infoSection}>
          <Title level={2} className={styles.title}>
            {image.title}
          </Title>

          <div className={styles.meta}>
            <div className={styles.author}>
              <Avatar
                size={40}
                src={getImageUrl(image.author?.avatarUrl)}
                icon={<UserOutlined />}
              />
              <div className={styles.authorInfo}>
                <Text strong>{image.author?.username || '我'}</Text>
                <Text type="secondary" className={styles.date}>
                  <CalendarOutlined /> {dayjs(image.createdAt).format('YYYY-MM-DD HH:mm')}
                </Text>
              </div>
            </div>
          </div>

          {image.description && (
            <div className={styles.description}>
              <Title level={5}>描述</Title>
              <Paragraph>{image.description}</Paragraph>
            </div>
          )}

          {image.tags && image.tags.length > 0 && (
            <div className={styles.tags}>
              <Title level={5}>标签</Title>
              <div className={styles.tagList}>
                {image.tags.map((tag) => (
                  <Tag
                    key={tag.id}
                    color="purple"
                    className={styles.tag}
                    onClick={() => handleTagClick(tag.id)}
                  >
                    {tag.name}
                  </Tag>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 隐私图片不显示评论区 */}

      <Modal
        open={previewVisible}
        footer={null}
        onCancel={() => setPreviewVisible(false)}
        width="90%"
        style={{ maxWidth: 1200 }}
        centered
      >
        <img
          src={getImageUrl(image.imageUrl)}
          alt={image.title}
          style={{ width: '100%', height: 'auto' }}
        />
      </Modal>
    </div>
  )
}