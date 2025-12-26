import { useNavigate } from 'react-router-dom'
import { Card, Tag, Avatar, Space } from 'antd'
import { EyeOutlined, UserOutlined, ClockCircleOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import type { ArticleCardProps } from '../../types'
import { getImageUrl } from '../../services/api'
import styles from './ArticleCard.module.css'

export function ArticleCard({ article, onTagClick }: ArticleCardProps) {
  const navigate = useNavigate()

  const handleCardClick = () => {
    navigate(`/article/${article.id}`)
  }

  const handleTagClick = (e: React.MouseEvent, tagId: string) => {
    e.stopPropagation()
    if (onTagClick) {
      onTagClick(tagId)
    } else {
      navigate(`/tag/${tagId}`)
    }
  }

  const handleAuthorClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    navigate(`/user/${article.authorId}`)
  }

  return (
    <Card
      className={styles.card}
      hoverable
      onClick={handleCardClick}
      cover={
        article.coverUrl && (
          <div className={styles.coverWrapper}>
            <img
              alt={article.title}
              src={getImageUrl(article.coverUrl)}
              className={styles.cover}
            />
          </div>
        )
      }
    >
      <div className={styles.content}>
        <h3 className={styles.title}>{article.title}</h3>
        <p className={styles.summary}>{article.summary}</p>
        
        <div className={styles.tags}>
          {article.tags.map(tag => (
            <Tag
              key={tag.id}
              color="purple"
              className={styles.tag}
              onClick={(e) => handleTagClick(e, tag.id)}
            >
              {tag.name}
            </Tag>
          ))}
        </div>

        <div className={styles.meta}>
          <Space className={styles.author} onClick={handleAuthorClick}>
            <Avatar
              size="small"
              src={getImageUrl(article.author.avatarUrl)}
              icon={<UserOutlined />}
            />
            <span>{article.author.username}</span>
          </Space>
          
          <Space className={styles.stats}>
            <span><EyeOutlined /> {article.views}</span>
            <span><ClockCircleOutlined /> {dayjs(article.createdAt).format('MM-DD')}</span>
          </Space>
        </div>
      </div>
    </Card>
  )
}
