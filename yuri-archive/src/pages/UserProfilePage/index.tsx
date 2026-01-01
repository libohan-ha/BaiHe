import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Typography, Avatar, Tabs, message, Row, Col, Card, Spin, Empty } from 'antd'
import { UserOutlined, EditOutlined, PictureOutlined } from '@ant-design/icons'
import { ArticleList, GalleryList } from '../../components'
import { getUserById, getUserArticles, getUserImages, getImageUrl } from '../../services/api'
import type { User, Article, GalleryImage } from '../../types'
import styles from './UserProfilePage.module.css'

const { Title, Text } = Typography
const PAGE_SIZE = 10

export function UserProfilePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  
  const [user, setUser] = useState<User | null>(null)
  const [articles, setArticles] = useState<Article[]>([])
  const [images, setImages] = useState<GalleryImage[]>([])
  const [loading, setLoading] = useState(true)
  const [articlesLoading, setArticlesLoading] = useState(false)
  const [imagesLoading, setImagesLoading] = useState(false)
  const [articlesPage, setArticlesPage] = useState(1)
  const [imagesPage, setImagesPage] = useState(1)
  const [articlesTotal, setArticlesTotal] = useState(0)
  const [imagesTotal, setImagesTotal] = useState(0)
  const [activeTab, setActiveTab] = useState('articles')

  useEffect(() => {
    if (id) {
      loadUser()
    }
  }, [id])

  useEffect(() => {
    if (id) {
      loadArticles()
    }
  }, [id, articlesPage])

  useEffect(() => {
    if (id) {
      loadImages()
    }
  }, [id, imagesPage])

  const loadUser = async () => {
    if (!id) return
    setLoading(true)
    try {
      const data = await getUserById(id)
      setUser(data)
    } catch (err) {
      message.error(err instanceof Error ? err.message : '用户不存在')
      navigate('/')
    } finally {
      setLoading(false)
    }
  }

  const loadArticles = async () => {
    if (!id) return
    setArticlesLoading(true)
    try {
      const res = await getUserArticles(id, articlesPage, PAGE_SIZE)
      setArticles(res.data)
      setArticlesTotal(res.total)
    } catch (err) {
      // 忽略错误
    } finally {
      setArticlesLoading(false)
    }
  }

  const loadImages = async () => {
    if (!id) return
    setImagesLoading(true)
    try {
      const res = await getUserImages(id, imagesPage, PAGE_SIZE)
      setImages(res.data)
      setImagesTotal(res.total)
    } catch (err) {
      // 忽略错误
    } finally {
      setImagesLoading(false)
    }
  }

  if (loading) {
    return (
      <div className={styles.loading}>
        <Spin size="large" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className={styles.notFound}>
        <Empty description="用户不存在" />
      </div>
    )
  }

  const tabItems = [
    {
      key: 'articles',
      label: (
        <span>
          <EditOutlined /> 文章 ({articlesTotal})
        </span>
      ),
      children: (
        <ArticleList
          articles={articles}
          loading={articlesLoading}
          pagination={{
            current: articlesPage,
            total: articlesTotal,
            pageSize: PAGE_SIZE,
            onChange: setArticlesPage,
          }}
        />
      ),
    },
    {
      key: 'images',
      label: (
        <span>
          <PictureOutlined /> 图片 ({imagesTotal})
        </span>
      ),
      children: (
        <GalleryList
          images={images}
          loading={imagesLoading}
          pagination={{
            current: imagesPage,
            total: imagesTotal,
            pageSize: PAGE_SIZE,
            onChange: setImagesPage,
          }}
        />
      ),
    },
  ]

  return (
    <div className={styles.container}>
      <Row gutter={24}>
        <Col xs={24} md={8} lg={6}>
          <Card className={styles.profileCard}>
            <div className={styles.profile}>
              <Avatar
                size={80}
                src={getImageUrl(user.avatarUrl)}
                icon={<UserOutlined />}
                className={styles.avatar}
              />
              <Title level={4} className={styles.username}>
                {user.username}
              </Title>
              <Text className={styles.bio}>
                {user.bio || '这个人很懒，什么都没写~'}
              </Text>
              <div className={styles.stats}>
                <div className={styles.statItem}>
                  <span className={styles.statValue}>{articlesTotal}</span>
                  <span className={styles.statLabel}>文章</span>
                </div>
                <div className={styles.statItem}>
                  <span className={styles.statValue}>{imagesTotal}</span>
                  <span className={styles.statLabel}>图片</span>
                </div>
              </div>
            </div>
          </Card>
        </Col>
        
        <Col xs={24} md={16} lg={18}>
          <Card className={styles.contentCard}>
            <Tabs
              activeKey={activeTab}
              onChange={setActiveTab}
              items={tabItems}
            />
          </Card>
        </Col>
      </Row>
    </div>
  )
}