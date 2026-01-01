import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Typography, Breadcrumb, Tag as AntTag, Spin, message } from 'antd'
import { TagOutlined } from '@ant-design/icons'
import { ArticleList } from '../../components'
import { getArticlesByTag, getTags } from '../../services/api'
import type { Article, Tag } from '../../types'
import styles from './TagPage.module.css'

const { Title } = Typography
const PAGE_SIZE = 10

export function TagPage() {
  const { id } = useParams<{ id: string }>()
  const [articles, setArticles] = useState<Article[]>([])
  const [tag, setTag] = useState<Tag | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    if (id) {
      loadData()
    }
  }, [id, page])

  const loadData = async () => {
    if (!id) return
    setLoading(true)
    try {
      // 先获取标签信息
      const tagsRes = await getTags()
      const foundTag = tagsRes.find(t => t.id === id)
      setTag(foundTag || null)
      
      // 用标签 ID 获取文章
      const articlesRes = await getArticlesByTag(id, page, PAGE_SIZE)
      setArticles(articlesRes.data)
      setTotal(articlesRes.total)
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

  if (loading && !tag) {
    return (
      <div className={styles.loading}>
        <Spin size="large" />
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <Breadcrumb
        className={styles.breadcrumb}
        items={[
          { title: <Link to="/">首页</Link> },
          { title: '标签筛选' },
          { title: tag?.name || '未知标签' },
        ]}
      />

      <div className={styles.header}>
        <Title level={2} className={styles.title}>
          <TagOutlined /> 标签筛选
        </Title>
        {tag && (
          <div className={styles.tagInfo}>
            <AntTag color="purple" className={styles.currentTag}>
              {tag.name}
            </AntTag>
            <span className={styles.count}>共 {total} 篇文章</span>
          </div>
        )}
      </div>

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
