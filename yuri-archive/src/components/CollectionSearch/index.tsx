import { Input } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import styles from './CollectionSearch.module.css'

interface CollectionSearchProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export function CollectionSearch({ value, onChange, placeholder = '搜索收藏...' }: CollectionSearchProps) {
  return (
    <div className={styles.searchContainer}>
      <Input
        prefix={<SearchOutlined className={styles.searchIcon} />}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        allowClear
        className={styles.searchInput}
      />
    </div>
  )
}