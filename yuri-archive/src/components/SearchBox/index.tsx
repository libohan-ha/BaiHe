import { Input } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import type { SearchBoxProps } from '../../types'
import styles from './SearchBox.module.css'

export function SearchBox({ defaultValue, onSearch, placeholder = '搜索文章...' }: SearchBoxProps) {
  return (
    <Input.Search
      className={styles.searchBox}
      placeholder={placeholder}
      defaultValue={defaultValue}
      onSearch={onSearch}
      enterButton={<SearchOutlined />}
      size="large"
      allowClear
    />
  )
}
