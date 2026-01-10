import React, { useRef } from 'react'
import { Spin } from 'antd'
import { CloseOutlined, PictureOutlined, SendOutlined } from '@ant-design/icons'
import { getImageUrl } from '../../../services/api'
import styles from '../AIChatRoomPage.module.css'

interface InputAreaProps {
  inputValue: string
  onInputChange: (value: string) => void
  onSend: () => void
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void
  onPaste: (e: React.ClipboardEvent<HTMLTextAreaElement>) => void
  onImageSelect: (e: React.ChangeEvent<HTMLInputElement>) => void
  onRemoveImage: (index: number) => void
  selectedImages: string[]
  disabled?: boolean
  sending?: boolean
  imageUploading?: boolean
  inputRef?: React.RefObject<HTMLTextAreaElement | null>
}

export const InputArea: React.FC<InputAreaProps> = ({
  inputValue,
  onInputChange,
  onSend,
  onKeyDown,
  onPaste,
  onImageSelect,
  onRemoveImage,
  selectedImages,
  disabled = false,
  sending = false,
  imageUploading = false,
  inputRef: externalInputRef,
}) => {
  const internalImageInputRef = useRef<HTMLInputElement>(null)

  const handleImageButtonClick = () => {
    internalImageInputRef.current?.click()
  }

  const canSend = (inputValue.trim() || selectedImages.length > 0) && !sending

  return (
    <div className={styles.inputArea}>
      {/* 已选择的图片预览 */}
      {selectedImages.length > 0 && (
        <div className={styles.selectedImagesPreview}>
          {selectedImages.map((imgUrl, idx) => (
            <div key={idx} className={styles.previewImageWrapper}>
              <img src={getImageUrl(imgUrl)} alt={`预览 ${idx + 1}`} className={styles.previewImage} />
              <button
                className={styles.removeImageBtn}
                onClick={() => onRemoveImage(idx)}
                type="button"
              >
                <CloseOutlined />
              </button>
            </div>
          ))}
        </div>
      )}
      <div className={styles.inputContainer}>
        {/* 隐藏的文件输入 */}
        <input
          ref={internalImageInputRef}
          type="file"
          accept="image/*"
          multiple
          style={{ display: 'none' }}
          onChange={onImageSelect}
        />
        {/* 图片上传按钮 */}
        <button
          className={styles.actionButton}
          onClick={handleImageButtonClick}
          disabled={disabled || sending || imageUploading}
          type="button"
        >
          {imageUploading ? <Spin size="small" /> : <PictureOutlined style={{ fontSize: 20, color: '#666' }} />}
        </button>
        <div className={styles.inputWrapper}>
          <textarea
            ref={externalInputRef}
            value={inputValue}
            onChange={e => onInputChange(e.target.value)}
            onKeyDown={onKeyDown}
            onPaste={onPaste}
            placeholder={selectedImages.length > 0 ? "添加说明（可选）... (Ctrl+Enter 换行)" : "输入消息... (Ctrl+Enter 换行)"}
            disabled={disabled || sending}
            rows={1}
          />
        </div>
        <button
          className={styles.sendButton}
          onClick={onSend}
          disabled={!canSend || disabled}
          type="button"
        >
          {sending ? <Spin size="small" /> : <SendOutlined />}
        </button>
      </div>
    </div>
  )
}
