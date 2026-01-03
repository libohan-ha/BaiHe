import { useState } from 'react'
import { Card, Tag, Avatar, Typography, Tooltip, message } from 'antd'
import { EyeOutlined, UserOutlined, LockOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import type { GalleryCardProps } from '../../types'
import { getImageUrl, transferToPrivateGallery } from '../../services/api'
import { useUserStore } from '../../store/userStore'
import styles from './GalleryCard.module.css'

const { Text } = Typography

interface ExtendedGalleryCardProps extends GalleryCardProps {
  showTransferButton?: boolean
  onTransferSuccess?: () => void
}

export function GalleryCard({
  image,
  onTagClick,
  onImageClick,
  showTransferButton = true,
  onTransferSuccess
}: ExtendedGalleryCardProps) {
  const navigate = useNavigate()
  const { currentUser, isLoggedIn } = useUserStore()
  const [transferring, setTransferring] = useState(false)

  // 判断是否是图片的上传者
  const isOwner = isLoggedIn && currentUser && currentUser.id === image.authorId

  const handleClick = () => {
    if (onImageClick) {
      onImageClick(image.id)
    } else {
      navigate(`/image/${image.id}`)
    }
  }

  const handleTagClick = (e: React.MouseEvent, tagId: string) => {
    e.stopPropagation()
    if (onTagClick) {
      onTagClick(tagId)
    } else {
      navigate(`/gallery?tag=${tagId}`)
    }
  }

  const handleAuthorClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (image.author?.id || image.authorId) {
      navigate(`/user/${image.author?.id || image.authorId}`)
    }
  }

  const handleTransfer = async (e: React.MouseEvent) => {
    e.stopPropagation()
    
    if (!isLoggedIn) {
      message.warning('请先登录')
      navigate('/login')
      return
    }

    if (!isOwner) {
      message.warning('只能转移自己上传的图片')
      return
    }

    setTransferring(true)
    try {
      await transferToPrivateGallery(image.id)
      message.success('已转移到隐私相册')
      if (onTransferSuccess) {
        onTransferSuccess()
      }
    } catch (err) {
      message.error(err instanceof Error ? err.message : '转移失败')
    } finally {
      setTransferring(false)
    }
  }

  return (
    <Card
      hoverable
      className={styles.card}
      onClick={handleClick}
      cover={
        <div className={styles.imageContainer}>
          <img
            alt={image.title}
            src={getImageUrl(image.thumbnailUrl || image.imageUrl)}
            className={styles.image}
          />
          <div className={styles.overlay}>
            <EyeOutlined className={styles.viewIcon} />
            <span>{image.views}</span>
          </div>
          {/* 转移到隐私相册按钮 - 只有上传者可以看到 */}
          {showTransferButton && isOwner && (
            <Tooltip title="转移到隐私相册">
              <div
                className={`${styles.transferButton} ${transferring ? styles.transferring : ''}`}
                onClick={handleTransfer}
              >
                <LockOutlined />
              </div>
            </Tooltip>
          )}
        </div>
      }
    >
      <div className={styles.content}>
        <Text strong className={styles.title} ellipsis>
          {image.title}
        </Text>
        
        <div className={styles.author} onClick={handleAuthorClick} style={{ cursor: 'pointer' }}>
          <Avatar
            size="small"
            src={getImageUrl(image.author?.avatarUrl)}
            icon={<UserOutlined />}
          />
          <Text type="secondary" className={styles.authorName}>
            {image.author?.username || '匿名用户'}
          </Text>
        </div>

        {image.tags && image.tags.length > 0 && (
          <div className={styles.tags}>
            {image.tags.slice(0, 3).map((tag) => (
              <Tag
                key={tag.id}
                color="purple"
                className={styles.tag}
                onClick={(e) => handleTagClick(e, tag.id)}
              >
                {tag.name}
              </Tag>
            ))}
            {image.tags.length > 3 && (
              <Tag className={styles.moreTag}>+{image.tags.length - 3}</Tag>
            )}
          </div>
        )}
      </div>
    </Card>
  )
}