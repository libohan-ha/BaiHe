import { memo } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkBreaks from 'remark-breaks'
import type { MarkdownRendererProps } from '../../types'
import { ImagePreview } from '../ImagePreview'
import styles from './ChatMarkdownRenderer.module.css'

export const ChatMarkdownRenderer = memo(function ChatMarkdownRenderer({
  content,
}: MarkdownRendererProps) {
  return (
    <div className={styles.chatMarkdown}>
      <ReactMarkdown
        remarkPlugins={[remarkBreaks]}
        components={{
          img: ({ src, alt }) => (
            <ImagePreview
              src={src || ''}
              alt={alt || '图片'}
              className={styles.chatMarkdownImage}
            />
          ),
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noreferrer">
              {children}
            </a>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
})
