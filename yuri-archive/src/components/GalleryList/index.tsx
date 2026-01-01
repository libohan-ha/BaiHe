import { Row, Col, Pagination, Empty, Spin } from 'antd'
import { GalleryCard } from '../GalleryCard'
import type { GalleryListProps } from '../../types'
import styles from './GalleryList.module.css'

export function GalleryList({
  images,
  loading = false,
  pagination,
  onTagClick,
  onImageClick,
}: GalleryListProps) {
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