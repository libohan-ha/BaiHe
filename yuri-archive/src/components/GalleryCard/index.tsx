import { EyeOutlined, UserOutlined } from '@ant-design/icons'
import { Avatar, Card, Checkbox, Tag, Typography } from 'antd'
import { useNavigate } from 'react-router-dom'
import { getImageUrl } from '../../services/api'
import type { GalleryCardProps } from '../../types'
import styles from './GalleryCard.module.css'

const { Text } = Typography

interface ExtendedGalleryCardProps extends GalleryCardProps {
  selectable?: boolean
  selected?: boolean
  onSelect?: (imageId: string, selected: boolean) => void
}

export function GalleryCard({
  image,
  onTagClick,
  onImageClick,
  selectable = false,
  selected = false,
  onSelect
}: ExtendedGalleryCardProps) {
  const navigate = useNavigate()

  const handleClick = () => {
    if (selectable && onSelect) {
      onSelect(image.id, !selected)
      return
    }
    if (onImageClick) {
      onImageClick(image.id)
    } else {
      navigate(`/image/${image.id}`)
    }
  }

  const handleTagClick = (e: React.MouseEvent, tagId: string) => {
    e.stopPropagation()
    if (selectable) return // 选择模式下不处理标签点击
    if (onTagClick) {
      onTagClick(tagId)
    } else {
      navigate(`/gallery?tag=${tagId}`)
    }
  }

  const handleAuthorClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (selectable) return // 选择模式下不处理作者点击
    if (image.author?.id || image.authorId) {
      navigate(`/user/${image.author?.id || image.authorId}`)
    }
  }

  const handleCheckboxChange = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onSelect) {
      onSelect(image.id, !selected)
    }
  }

  return (
    <Card
      hoverable
      className={`${styles.card} ${selected ? styles.selected : ''}`}
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
          {/* 选择模式下显示复选框 */}
          {selectable && (
            <div className={styles.checkboxWrapper} onClick={handleCheckboxChange}>
              <Checkbox checked={selected} />
            </div>
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