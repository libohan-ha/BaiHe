import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Typography, message, Button, Space } from 'antd'
import { PlusOutlined, LockOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { GalleryList } from '../../components/GalleryList'
import { ImageTagCloud } from '../../components/ImageTagCloud'
import { getImages, getPopularImageTags, batchTransferToPrivateGallery } from '../../services/api'
import { useUserStore } from '../../store/userStore'
import type { GalleryImage, ImageTag } from '../../types'
import styles from './GalleryPage.module.css'

const { Title } = Typography
const PAGE_SIZE = 12

export function GalleryPage() {
  const [images, setImages] = useState<GalleryImage[]>([])
  const [tags, setTags] = useState<ImageTag[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const { isLoggedIn } = useUserStore()

  // 选择模式状态
  const [selectMode, setSelectMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [transferring, setTransferring] = useState(false)

  const tagId = searchParams.get('tag')
  const searchKeyword = searchParams.get('search')
  const pageParam = Number(searchParams.get('page'))
  const page = Number.isInteger(pageParam) && pageParam > 0 ? pageParam : 1

  useEffect(() => {
    loadData()
  }, [page, tagId, searchKeyword])

  // 退出选择模式时清空选择
  useEffect(() => {
    if (!selectMode) {
      setSelectedIds([])
    }
  }, [selectMode])

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
    const nextParams = new URLSearchParams(searchParams)
    if (newPage > 1) {
      nextParams.set('page', String(newPage))
    } else {
      nextParams.delete('page')
    }
    setSearchParams(nextParams)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleTagClick = (clickedTagId: string) => {
    const nextParams = new URLSearchParams(searchParams)
    nextParams.set('tag', clickedTagId)
    nextParams.delete('search')
    nextParams.delete('page')
    setSearchParams(nextParams)
  }

  const handleUpload = () => {
    if (!isLoggedIn) {
      message.warning('请先登录')
      navigate('/login')
      return
    }
    navigate('/upload-image')
  }

  // 进入选择模式
  const handleEnterSelectMode = () => {
    if (!isLoggedIn) {
      message.warning('请先登录')
      navigate('/login')
      return
    }
    setSelectMode(true)
  }

  // 退出选择模式
  const handleExitSelectMode = () => {
    setSelectMode(false)
  }

  // 确认转移
  const handleConfirmTransfer = async () => {
    if (selectedIds.length === 0) {
      message.warning('请至少选择一张图片')
      return
    }

    setTransferring(true)
    try {
      const result = await batchTransferToPrivateGallery(selectedIds)
      const successCount = result.success.length
      const failedCount = result.failed.length

      if (successCount > 0 && failedCount === 0) {
        message.success(`成功转移 ${successCount} 张图片到隐私相册`)
      } else if (successCount > 0 && failedCount > 0) {
        message.warning(`成功转移 ${successCount} 张，${failedCount} 张失败`)
      } else {
        message.error('转移失败')
      }

      setSelectMode(false)
    } catch (err) {
      message.error(err instanceof Error ? err.message : '转移失败')
    } finally {
      setTransferring(false)
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <Title level={2} className={styles.title}>
            🖼️ 图片画廊
          </Title>
          <p className={styles.subtitle}>
            发现和分享精美的动漫插画作品
          </p>
        </div>
        <Space className={styles.headerButtons}>
          {!selectMode ? (
            <>
              {isLoggedIn && (
                <Button
                  icon={<LockOutlined />}
                  onClick={handleEnterSelectMode}
                  className={styles.transferModeButton}
                >
                  转移到隐私相册
                </Button>
              )}
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleUpload}
                className={styles.uploadButton}
              >
                上传图片
              </Button>
            </>
          ) : (
            <>
              <span className={styles.selectInfo}>
                已选择 {selectedIds.length} 张图片
              </span>
              <Button
                type="primary"
                icon={<CheckOutlined />}
                onClick={handleConfirmTransfer}
                loading={transferring}
                disabled={selectedIds.length === 0}
                className={styles.confirmButton}
              >
                确认转移
              </Button>
              <Button
                icon={<CloseOutlined />}
                onClick={handleExitSelectMode}
              >
                取消
              </Button>
            </>
          )}
        </Space>
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
        selectable={selectMode}
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
      />
    </div>
  )
}
