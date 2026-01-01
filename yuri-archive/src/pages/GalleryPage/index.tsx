import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Typography, message, Button } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { GalleryList } from '../../components/GalleryList'
import { ImageTagCloud } from '../../components/ImageTagCloud'
import { getImages, getPopularImageTags } from '../../services/api'
import { useUserStore } from '../../store/userStore'
import type { GalleryImage, ImageTag } from '../../types'
import styles from './GalleryPage.module.css'

const { Title } = Typography
const PAGE_SIZE = 12

export function GalleryPage() {
  const [images, setImages] = useState<GalleryImage[]>([])
  const [tags, setTags] = useState<ImageTag[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { isLoggedIn } = useUserStore()

  const tagId = searchParams.get('tag')
  const searchKeyword = searchParams.get('search')

  useEffect(() => {
    loadData()
  }, [page, tagId, searchKeyword])

  const loadData = async () => {
    setLoading(true)
    try {
      const [imagesRes, tagsRes] = await Promise.all([
        getImages({
          page,
          pageSize: PAGE_SIZE,
          tag: tagId || undefined,
          search: searchKeyword || undefined
        }),
        getPopularImageTags(8)
      ])
      setImages(imagesRes.data)
      setTotal(imagesRes.total)
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

  const handleTagClick = (clickedTagId: string) => {
    setPage(1)
    navigate(`/gallery?tag=${clickedTagId}`)
  }

  const handleUpload = () => {
    if (!isLoggedIn) {
      message.warning('请先登录')
      navigate('/login')
      return
    }
    navigate('/upload-image')
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <Title level={2} className={styles.title}>
            🖼️ 图片画廊
          </Title>
          <p className={styles.subtitle}>
            发现和分享精美的百合插画作品
          </p>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleUpload}
          className={styles.uploadButton}
        >
          上传图片
        </Button>
      </div>

      <ImageTagCloud tags={tags} onTagClick={handleTagClick} />

      {(tagId || searchKeyword) && (
        <div className={styles.filterInfo}>
          <span>
            {searchKeyword ? `搜索结果："${searchKeyword}"` : '当前筛选：'}
          </span>
          <Button
            type="link"
            onClick={() => navigate('/gallery')}
            className={styles.clearFilter}
          >
            清除{searchKeyword ? '搜索' : '筛选'}
          </Button>
        </div>
      )}

      <GalleryList
        images={images}
        loading={loading}
        pagination={{
          current: page,
          total,
          pageSize: PAGE_SIZE,
          onChange: handlePageChange,
        }}
        onTagClick={handleTagClick}
      />
    </div>
  )
}