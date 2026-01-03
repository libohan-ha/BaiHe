import { Row, Col, Pagination, Empty, Spin } from 'antd'
import { GalleryCard } from '../GalleryCard'
import type { GalleryListProps } from '../../types'
import styles from './GalleryList.module.css'

interface ExtendedGalleryListProps extends GalleryListProps {
  selectable?: boolean
  selectedIds?: string[]
  onSelectionChange?: (ids: string[]) => void
}

export function GalleryList({
  images,
  loading = false,
  pagination,
  onTagClick,
  onImageClick,
  selectable = false,
  selectedIds = [],
  onSelectionChange,
}: ExtendedGalleryListProps) {

  const handleSelect = (imageId: string, selected: boolean) => {
    if (!onSelectionChange) return
    if (selected) {
      onSelectionChange([...selectedIds, imageId])
    } else {
      onSelectionChange(selectedIds.filter(id => id !== imageId))
    }
  }
  if (loading) {
    return (
      <div className={styles.loading}>
        <Spin size="large" />
      </div>
    )
  }

  if (!images || images.length === 0) {
    return (
      <Empty
        className={styles.empty}
        description="暂无图片"
        image={Empty.PRESENTED_IMAGE_SIMPLE}
      />
    )
  }

  return (
    <div className={styles.container}>
      <Row gutter={[16, 16]}>
        {images.map((image) => (
          <Col key={image.id} xs={12} sm={8} md={6} lg={6} xl={4}>
            <GalleryCard
              image={image}
              onTagClick={onTagClick}
              onImageClick={onImageClick}
              selectable={selectable}
              selected={selectedIds.includes(image.id)}
              onSelect={handleSelect}
            />
          </Col>
        ))}
      </Row>

      {pagination && pagination.total > pagination.pageSize && (
        <div className={styles.pagination}>
          <Pagination
            current={pagination.current}
            total={pagination.total}
            pageSize={pagination.pageSize}
            onChange={pagination.onChange}
            showSizeChanger={false}
            showQuickJumper
            showTotal={(total) => `共 ${total} 张图片`}
          />
        </div>
      )}
    </div>
  )
}