import { Card, Tag, Avatar, Typography } from 'antd'
import { EyeOutlined, UserOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import type { GalleryCardProps } from '../../types'
import { getImageUrl } from '../../services/api'
import styles from './GalleryCard.module.css'

const { Text } = Typography

export function GalleryCard({ image, onTagClick, onImageClick }: GalleryCardProps) {
  const navigate = useNavigate()

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
        </div>
      }
    >
      <div className={styles.content}>
        <Text strong className={styles.title} ellipsis>
          {image.title}
        </Text>
        
        <div className={styles.author}>
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