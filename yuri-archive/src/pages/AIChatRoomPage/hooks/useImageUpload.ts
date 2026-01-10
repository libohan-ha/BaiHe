import { useState, useCallback } from 'react'
import { uploadChatImage, compressImage } from '../../../services/api'

export function useImageUpload() {
  const [selectedImages, setSelectedImages] = useState<string[]>([])
  const [imageUploading, setImageUploading] = useState(false)

  const handleImageUpload = useCallback(async (files: File[]) => {
    if (!files || files.length === 0) return

    setImageUploading(true)
    try {
      for (const file of files) {
        // 验证文件类型
        if (!file.type.startsWith('image/')) {
          continue
        }

        // 压缩大图片
        const processedFile = await compressImage(file)

        // 上传到服务器
        const result = await uploadChatImage(processedFile)
        setSelectedImages(prev => [...prev, result.url])
      }
    } finally {
      setImageUploading(false)
    }
  }, [])

  const handleRemoveImage = useCallback((index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index))
  }, [])

  const clearImages = useCallback(() => {
    setSelectedImages([])
  }, [])

  return {
    selectedImages,
    setSelectedImages,
    imageUploading,
    handleImageUpload,
    handleRemoveImage,
    clearImages,
  }
}
