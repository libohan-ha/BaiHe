import { Tag } from 'antd'
import { useNavigate } from 'react-router-dom'
import type { ImageTagCloudProps } from '../../types'
import styles from './ImageTagCloud.module.css'

export function ImageTagCloud({
  tags,
  onTagClick,
  maxDisplay = 10,
}: ImageTagCloudProps) {
  const navigate = useNavigate()

  const displayTags = tags.slice(0, maxDisplay)

  const handleTagClick = (tagId: string) => {
    if (onTagClick) {
      onTagClick(tagId)
    } else {
      navigate(`/gallery?tag=${tagId}`)
    }
  }

  if (!tags || tags.length === 0) {
    return null
  }

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>🖼️ 热门标签</h3>
      <div className={styles.tags}>
        {displayTags.map((tag) => (
          <Tag
            key={tag.id}
            className={styles.tag}
            onClick={() => handleTagClick(tag.id)}
          >
            {tag.name}
            <span className={styles.count}>({tag.imageCount})</span>
          </Tag>
        ))}
        {tags.length > maxDisplay && (
          <Tag
            className={styles.moreTag}
            onClick={() => navigate('/gallery/tags')}
          >
            更多...
          </Tag>
        )}
      </div>
    </div>
  )
}