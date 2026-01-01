import { useNavigate } from 'react-router-dom'
import { Tag, Typography } from 'antd'
import { TagOutlined } from '@ant-design/icons'
import type { TagCloudProps } from '../../types'
import styles from './TagCloud.module.css'

const { Title } = Typography

const tagColors = [
  'magenta', 'purple', 'geekblue', 'cyan', 'pink', 
  'volcano', 'orange', 'gold'
]

export function TagCloud({ tags, onTagClick, maxDisplay = 8 }: TagCloudProps) {
  const navigate = useNavigate()
  const displayTags = tags.slice(0, maxDisplay)

  const handleTagClick = (tagId: string) => {
    if (onTagClick) {
      onTagClick(tagId)
    } else {
      navigate(`/tag/${tagId}`)
    }
  }

  return (
    <div className={styles.container}>
      <Title level={5} className={styles.title}>
        <TagOutlined /> 热门标签
      </Title>
      <div className={styles.tags}>
        {displayTags.map((tag, index) => (
          <Tag
            key={tag.id}
            color={tagColors[index % tagColors.length]}
            className={styles.tag}
            onClick={() => handleTagClick(tag.id)}
          >
            {tag.name}
            <span className={styles.count}>({tag.articleCount})</span>
          </Tag>
        ))}
      </div>
    </div>
  )
}
