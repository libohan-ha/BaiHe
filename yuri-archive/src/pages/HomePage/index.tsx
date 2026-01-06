import { PlusOutlined } from '@ant-design/icons'
import { Button, Typography, message } from 'antd'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArticleList, TagCloud } from '../../components'
import { getArticles, getPopularTags } from '../../services/api'
import { useUserStore } from '../../store'
import type { Article, Tag } from '../../types'
import styles from './HomePage.module.css'

const { Title } = Typography
const PAGE_SIZE = 10

export function HomePage() {
  const navigate = useNavigate()
  const { isLoggedIn } = useUserStore()
  const [articles, setArticles] = useState<Article[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    loadData()
  }, [page])

  const loadData = async () => {
    setLoading(true)
    try {
      const [articlesRes, tagsRes] = await Promise.all([
        getArticles({ page, pageSize: PAGE_SIZE }),
        getPopularTags(8)
      ])
      setArticles(articlesRes.data)
      setTotal(articlesRes.total)
      setTags(tagsRes)
    } catch (err) {
      message.error(err instanceof Error ? err.message : '加载数据失败')
    } finally {
      setLoading(false)
    }
  }

  const handlePageChange = (newPage: number) => {
    setPage(newPage)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className={styles.container}>
      <div className={styles.pageHeader}>
        <div className={styles.headerLeft}>
          <Title level={2} className={styles.title}>
            🌸 发现精彩文学
          </Title>
          <p className={styles.subtitle}>
            在这里，收藏与分享你喜爱的故事
          </p>
        </div>
        {isLoggedIn && (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate('/create')}
            className={styles.createButton}
          >
            新增文章
          </Button>
        )}
      </div>

      <TagCloud tags={tags} />

      <ArticleList
        articles={articles}
        loading={loading}
        pagination={{
          current: page,
          total,
          pageSize: PAGE_SIZE,
          onChange: handlePageChange,
        }}
      />
    </div>
  )
}
