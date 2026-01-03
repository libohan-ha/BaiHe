import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Typography, message, Button, Empty } from 'antd'
import { PlusOutlined, LockOutlined } from '@ant-design/icons'
import { GalleryList } from '../../components/GalleryList'
import { ImageTagCloud } from '../../components/ImageTagCloud'
import { getPrivateImages, getPopularPrivateImageTags } from '../../services/api'
import { useUserStore } from '../../store/userStore'
import type { PrivateImage, PrivateImageTag, GalleryImage } from '../../types'
import styles from './PrivateGalleryPage.module.css'

const { Title } = Typography
const PAGE_SIZE = 12

export function PrivateGalleryPage() {
  const [images, setImages] = useState<PrivateImage[]>([])
  const [tags, setTags] = useState<PrivateImageTag[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { isLoggedIn } = useUserStore()

  const tagId = searchParams.get('tag')
  const searchKeyword = searchParams.get('search')

  useEffect(() => {
    if (!isLoggedIn) {
      message.warning('请先登录')
      navigate('/login')
      return
    }
    loadData()
  }, [page, tagId, searchKeyword, isLoggedIn, navigate])

  const loadData = async () => {
    setLoading(true)
    try {
      const [imagesRes, tagsRes] = await Promise.all([
        getPrivateImages({
          page,
          pageSize: PAGE_SIZE,
          tag: tagId || undefined,
          search: searchKeyword || undefined
        }),
        getPopularPrivateImageTags(8)
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
    navigate(`/private-gallery?tag=${clickedTagId}`)
  }

  const handleUpload = () => {
    navigate('/upload-private-image')
  }

  const handleImageClick = (imageId: string) => {
    navigate(`/private-image/${imageId}`)
  }

  // 将 PrivateImage 转换为 GalleryImage 格式以便 GalleryList 使用
  const galleryImages: GalleryImage[] = images.map(img => ({
    id: img.id,
    title: img.title,
    imageUrl: img.imageUrl,
    thumbnailUrl: img.thumbnailUrl,
    description: img.description,
    authorId: img.authorId,
    author: img.author,
    tags: img.tags,
    views: 0, // 隐私图片没有浏览量
    createdAt: img.createdAt,
    updatedAt: img.updatedAt,
  }))

  if (!isLoggedIn) {
    return (
      <div className={styles.container}>
        <Empty
          image={<LockOutlined style={{ fontSize: 64, color: '#d9d9d9' }} />}
          description="请先登录查看隐私相册"
        >
          <Button type="primary" onClick={() => navigate('/login')}>
            去登录
          </Button>
        </Empty>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <Title level={2} className={styles.title}>
            <LockOutlined /> 隐私相册
          </Title>
          <p className={styles.subtitle}>
            只有你自己可以查看的私密图片空间
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

      {tags.length > 0 && (
        <ImageTagCloud tags={tags} onTagClick={handleTagClick} />
      )}

      {(tagId || searchKeyword) && (
        <div className={styles.filterInfo}>
          <span>
            {searchKeyword ? `搜索结果："${searchKeyword}"` : '当前筛选：'}
          </span>
          <Button
            type="link"
            onClick={() => navigate('/private-gallery')}
            className={styles.clearFilter}
          >
            清除{searchKeyword ? '搜索' : '筛选'}
          </Button>
        </div>
      )}

      {!loading && images.length === 0 ? (
        <Empty
          description="暂无隐私图片"
          className={styles.empty}
        >
          <Button type="primary" onClick={handleUpload}>
            上传第一张图片
          </Button>
        </Empty>
      ) : (
        <GalleryList
          images={galleryImages}
          loading={loading}
          pagination={{
            current: page,
            total,
            pageSize: PAGE_SIZE,
            onChange: handlePageChange,
          }}
          onTagClick={handleTagClick}
          onImageClick={handleImageClick}
        />
      )}
    </div>
  )
}