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
} from 'antd'
import {
  ArrowLeftOutlined,
  HeartOutlined,
  HeartFilled,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  UserOutlined,
  CalendarOutlined,
  LockOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import { getImageById, deleteImage, addImageCollection, removeImageCollection, getImageCollections, transferToPrivateGallery } from '../../services/api'
import { getImageUrl } from '../../services/api'
import { useUserStore } from '../../store/userStore'
import { CommentSection } from '../../components'
import type { GalleryImage } from '../../types'
import styles from './ImageDetailPage.module.css'

const { Title, Text, Paragraph } = Typography

export function ImageDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { currentUser, isLoggedIn } = useUserStore()
  
  const [image, setImage] = useState<GalleryImage | null>(null)
  const [loading, setLoading] = useState(true)
  const [isCollected, setIsCollected] = useState(false)
  const [collectionId, setCollectionId] = useState<string | null>(null)
  const [collectLoading, setCollectLoading] = useState(false)
  const [previewVisible, setPreviewVisible] = useState(false)
  const [transferring, setTransferring] = useState(false)

  useEffect(() => {
    if (id) {
      loadImage()
      if (isLoggedIn) {
        checkCollection()
      }
    }
  }, [id, isLoggedIn])

  const loadImage = async () => {
    if (!id) return
    setLoading(true)
    try {
      const data = await getImageById(id)
      setImage(data)
    } catch (err) {
      message.error(err instanceof Error ? err.message : '加载图片失败')
      navigate('/gallery')
    } finally {
      setLoading(false)
    }
  }

  const checkCollection = async () => {
    try {
      const res = await getImageCollections(1, 100)
      const found = res.data.find(item => item.id === id)
      if (found) {
        setIsCollected(true)
        setCollectionId(found.collectionId)
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
      if (isCollected && collectionId) {
        await removeImageCollection(collectionId)
        setIsCollected(false)
        setCollectionId(null)
        message.success('已取消收藏')
      } else {
        const res = await addImageCollection(id)
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
    navigate(`/edit-image/${id}`)
  }

  const handleDelete = async () => {
    if (!id) return
    try {
      await deleteImage(id)
      message.success('删除成功')
      navigate('/gallery')
    } catch (err) {
      message.error(err instanceof Error ? err.message : '删除失败')
    }
  }

  const handleBack = () => {
    navigate(-1)
  }

  const handleTagClick = (tagId: string) => {
    navigate(`/gallery?tag=${tagId}`)
  }

  const handleAuthorClick = () => {
    if (image?.author?.id || image?.authorId) {
      navigate(`/user/${image.author?.id || image.authorId}`)
    }
  }

  const handleTransfer = async () => {
    if (!id) return
    setTransferring(true)
    try {
      const result = await transferToPrivateGallery(id)
      message.success('已转移到隐私相册')
      navigate(`/private-image/${result.id}`)
    } catch (err) {
      message.error(err instanceof Error ? err.message : '转移失败')
    } finally {
      setTransferring(false)
    }
  }

  const isOwner = currentUser && image && currentUser.id === image.authorId
  const isAdmin = currentUser && (currentUser.role === 'ADMIN' || currentUser.role === 'SUPER_ADMIN')
  const canEdit = isOwner || isAdmin
  const canDelete = isOwner || isAdmin
  const canTransfer = isLoggedIn // 所有登录用户都可以转移
  const displayTitle = image?.title?.trim()
  const displayDescription = image?.description?.trim()

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
          {canTransfer && (
            <Button
              type="default"
              icon={<LockOutlined />}
              onClick={handleTransfer}
              loading={transferring}
              className={styles.transferButton}
            >
              保存到隐私相册
            </Button>
          )}
          {canEdit && (
            <Button
              type="default"
              icon={<EditOutlined />}
              onClick={handleEdit}
            >
              编辑
            </Button>
          )}
          {canDelete && (
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
          )}
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
              alt={displayTitle || '图片'}
              className={styles.mainImage}
            />
          </div>
        </div>

        <div className={styles.infoSection}>
          {displayTitle && (
            <Title level={2} className={styles.title}>
              {displayTitle}
            </Title>
          )}

          <div className={styles.meta}>
            <div className={styles.author} onClick={handleAuthorClick} style={{ cursor: 'pointer' }}>
              <Avatar
                size={40}
                src={getImageUrl(image.author?.avatarUrl)}
                icon={<UserOutlined />}
              />
              <div className={styles.authorInfo}>
                <Text strong>{image.author?.username || '匿名用户'}</Text>
                <Text type="secondary" className={styles.date}>
                  <CalendarOutlined /> {dayjs(image.createdAt).format('YYYY-MM-DD HH:mm')}
                </Text>
              </div>
            </div>
            <div className={styles.stats}>
              <span className={styles.stat}>
                <EyeOutlined /> {image.views} 浏览
              </span>
            </div>
          </div>

          {displayDescription && (
            <div className={styles.description}>
              <Title level={5}>描述</Title>
              <Paragraph>{displayDescription}</Paragraph>
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

      {/* 评论区 */}
      <CommentSection imageId={id!} />

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
          alt={displayTitle || '图片'}
          style={{ width: '100%', height: 'auto' }}
        />
      </Modal>
    </div>
  )
}