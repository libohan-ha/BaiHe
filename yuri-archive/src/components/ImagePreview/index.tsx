import { useState } from 'react'
import { Modal } from 'antd'
import { getImageUrl } from '../../services/api'
import styles from './ImagePreview.module.css'

interface ImagePreviewProps {
  src: string           // 图片URL（相对或绝对）
  alt?: string          // 图片描述
  className?: string    // 缩略图样式
  thumbnailSrc?: string // 可选的缩略图URL（不传则使用 src）
}

/**
 * 图片预览组件
 * 点击缩略图后弹出 Modal 显示大图
 */
export function ImagePreview({ src, alt = '图片', className, thumbnailSrc }: ImagePreviewProps) {
  const [visible, setVisible] = useState(false)
  
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()  // 阻止事件冒泡
    setVisible(true)
  }
  
  return (
    <>
      {/* 缩略图 - 点击触发预览 */}
      <img
        src={getImageUrl(thumbnailSrc || src)}
        alt={alt}
        className={`${styles.thumbnail} ${className || ''}`}
        onClick={handleClick}
      />
      
      {/* 预览弹窗 */}
      <Modal
        open={visible}
        footer={null}
        onCancel={() => setVisible(false)}
        width="90%"
        style={{ maxWidth: 1200 }}
        centered
        className={styles.previewModal}
        destroyOnClose
      >
        <img
          src={getImageUrl(src)}
          alt={alt}
          className={styles.fullImage}
        />
      </Modal>
    </>
  )
}