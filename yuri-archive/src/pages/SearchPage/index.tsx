import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Typography, Select, Space, message } from 'antd'
import { ArticleList, SearchBox } from '../../components'
import { searchArticles } from '../../services/api'
import type { Article } from '../../types'
import styles from './SearchPage.module.css'

const { Title, Text } = Typography
const PAGE_SIZE = 10

export function SearchPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const keyword = searchParams.get('q') || ''
  
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [sortBy, setSortBy] = useState<'time' | 'views'>('time')

  useEffect(() => {
    if (keyword) {
      loadResults()
    }
  }, [keyword, page, sortBy])

  const loadResults = async () => {
    setLoading(true)
    try {
      const res = await searchArticles(keyword, page, PAGE_SIZE, sortBy)
      setArticles(res.data)
      setTotal(res.total)
    } catch (err) {
      message.error(err instanceof Error ? err.message : '搜索失败')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (value: string) => {
    if (value.trim()) {
      navigate(`/search?q=${encodeURIComponent(value.trim())}`)
      setPage(1)
    }
  }

  const handlePageChange = (newPage: number) => {
    setPage(newPage)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Title level={2} className={styles.title}>搜索结果</Title>
        <SearchBox defaultValue={keyword} onSearch={handleSearch} />
      </div>

      <div className={styles.toolbar}>
        <Text className={styles.resultCount}>
          {keyword && (
            <>
              关键词 "<Text strong>{keyword}</Text>" 共找到 <Text strong>{total}</Text> 篇文章
            </>
          )}
        </Text>
        
        <Space>
          <Text>排序：</Text>
          <Select
            value={sortBy}
            onChange={setSortBy}
            options={[
              { value: 'time', label: '最新发布' },
              { value: 'views', label: '最多阅读' },
            ]}
            style={{ width: 120 }}
          />
        </Space>
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
