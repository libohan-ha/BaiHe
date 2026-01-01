import ReactMarkdown from 'react-markdown'
import remarkBreaks from 'remark-breaks'
import type { MarkdownRendererProps } from '../../types'
import styles from './MarkdownRenderer.module.css'

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  // 将单换行转换为双换行，确保分段显示
  const processedContent = content?.replace(/\n/g, '\n\n') || ''
  
  return (
    <div className={styles.markdown}>
      <ReactMarkdown remarkPlugins={[remarkBreaks]}>
        {processedContent}
      </ReactMarkdown>
    </div>
  )
}
