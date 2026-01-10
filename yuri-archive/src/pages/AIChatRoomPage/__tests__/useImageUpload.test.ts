import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useImageUpload } from '../hooks/useImageUpload'

// Mock API
vi.mock('../../../services/api', () => ({
  uploadChatImage: vi.fn(),
  compressImage: vi.fn((file) => Promise.resolve(file)),
}))

import { uploadChatImage, compressImage } from '../../../services/api'

describe('useImageUpload', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should initialize with empty images and not uploading', () => {
    const { result } = renderHook(() => useImageUpload())

    expect(result.current.selectedImages).toEqual([])
    expect(result.current.imageUploading).toBe(false)
  })

  it('should add image URL after successful upload', async () => {
    const mockUrl = '/uploads/chat/test.jpg'
    vi.mocked(uploadChatImage).mockResolvedValue({ url: mockUrl })

    const { result } = renderHook(() => useImageUpload())

    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })

    await act(async () => {
      await result.current.handleImageUpload([file])
    })

    expect(result.current.selectedImages).toContain(mockUrl)
    expect(compressImage).toHaveBeenCalledWith(file)
    expect(uploadChatImage).toHaveBeenCalled()
  })

  it('should set uploading state during upload', async () => {
    let resolveUpload!: (value: { url: string }) => void
    const uploadPromise = new Promise<{ url: string }>((resolve) => {
      resolveUpload = resolve
    })
    vi.mocked(uploadChatImage).mockReturnValue(uploadPromise)

    const { result } = renderHook(() => useImageUpload())
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })

    // Start upload (don't await)
    act(() => {
      result.current.handleImageUpload([file])
    })

    // Should be uploading
    expect(result.current.imageUploading).toBe(true)

    // Complete upload
    await act(async () => {
      resolveUpload({ url: '/uploads/chat/test.jpg' })
      await uploadPromise
    })

    // Should not be uploading anymore
    expect(result.current.imageUploading).toBe(false)
  })

  it('should remove image at specified index', () => {
    const { result } = renderHook(() => useImageUpload())

    // Manually set images for testing
    act(() => {
      result.current.setSelectedImages(['/img1.jpg', '/img2.jpg', '/img3.jpg'])
    })

    act(() => {
      result.current.handleRemoveImage(1)
    })

    expect(result.current.selectedImages).toEqual(['/img1.jpg', '/img3.jpg'])
  })

  it('should clear all images', () => {
    const { result } = renderHook(() => useImageUpload())

    act(() => {
      result.current.setSelectedImages(['/img1.jpg', '/img2.jpg'])
    })

    act(() => {
      result.current.clearImages()
    })

    expect(result.current.selectedImages).toEqual([])
  })

  it('should skip non-image files', async () => {
    const { result } = renderHook(() => useImageUpload())

    const textFile = new File(['test'], 'test.txt', { type: 'text/plain' })

    await act(async () => {
      await result.current.handleImageUpload([textFile])
    })

    expect(result.current.selectedImages).toEqual([])
    expect(uploadChatImage).not.toHaveBeenCalled()
  })
})
