import { Row, Col, Pagination, Empty, Skeleton, Card } from 'antd'
import { ArticleCard } from '../ArticleCard'
import type { ArticleListProps } from '../../types'
import styles from './ArticleList.module.css'

export function ArticleList({ articles, loading, pagination, onTagClick }: ArticleListProps) {
  if (loading) {
    return (
      <Row gutter={[24, 24]}>
        {[1, 2, 3, 4, 5, 6].map(i => (
          <Col key={i} xs={24} sm={12} lg={8}>
            <Card>
              <Skeleton active avatar paragraph={{ rows: 3 }} />
            </Card>
          </Col>
        ))}
      </Row>
    )
  }

  if (!articles.length) {
    return (
      <Empty
        description="暂无文章"
        className={styles.empty}
      />
    )
  }

  return (
    <div className={styles.container}>
      <Row gutter={[24, 24]}>
        {articles.map(article => (
          <Col key={article.id} xs={24} sm={12} lg={8}>
            <ArticleCard article={article} onTagClick={onTagClick} />
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
            showTotal={(total) => `共 ${total} 篇文章`}
          />
        </div>
      )}
    </div>
  )
}
