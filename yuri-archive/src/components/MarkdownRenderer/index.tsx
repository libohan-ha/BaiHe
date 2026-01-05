import ReactMarkdown from 'react-markdown'
import remarkBreaks from 'remark-breaks'
import type { MarkdownRendererProps } from '../../types'
import { ImagePreview } from '../ImagePreview'
import styles from './MarkdownRenderer.module.css'

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  // 将单换行转换为双换行，确保分段显示
  const processedContent = content?.replace(/\n/g, '\n\n') || ''
  
  return (
    <div className={styles.markdown}>
      <ReactMarkdown
        remarkPlugins={[remarkBreaks]}
        components={{
          // 自定义图片渲染：使用 ImagePreview 组件实现点击预览
          img: ({ src, alt }) => (
            <ImagePreview
              src={src || ''}
              alt={alt || '图片'}
              className={styles.markdownImage}
            />
          )
        }}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  )
}
