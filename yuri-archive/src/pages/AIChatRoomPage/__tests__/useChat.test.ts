import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useChat } from '../hooks/useChat'

// Mock API
vi.mock('../../../services/api', () => ({
  sendChatMessage: vi.fn(),
  saveAssistantMessage: vi.fn(),
  formatMessageWithImages: vi.fn((content) => Promise.resolve(content)),
}))

describe('useChat', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useChat())

    expect(result.current.sending).toBe(false)
    expect(result.current.inputValue).toBe('')
    expect(result.current.regeneratingMessageId).toBeNull()
  })

  it('should update input value', () => {
    const { result } = renderHook(() => useChat())

    act(() => {
      result.current.setInputValue('Hello AI')
    })

    expect(result.current.inputValue).toBe('Hello AI')
  })

  it('should set sending state', () => {
    const { result } = renderHook(() => useChat())

    act(() => {
      result.current.setSending(true)
    })

    expect(result.current.sending).toBe(true)
  })

  it('should set regenerating message ID', () => {
    const { result } = renderHook(() => useChat())

    act(() => {
      result.current.setRegeneratingMessageId('msg123')
    })

    expect(result.current.regeneratingMessageId).toBe('msg123')
  })

  it('should manage editing message state', () => {
    const { result } = renderHook(() => useChat())

    act(() => {
      result.current.startEditMessage({ id: 'msg1', content: 'Original content', role: 'user' })
    })

    expect(result.current.editingMessageId).toBe('msg1')
    expect(result.current.editingMessageContent).toBe('Original content')

    act(() => {
      result.current.cancelEditMessage()
    })

    expect(result.current.editingMessageId).toBeNull()
    expect(result.current.editingMessageContent).toBe('')
  })

  it('should update editing message content', () => {
    const { result } = renderHook(() => useChat())

    act(() => {
      result.current.startEditMessage({ id: 'msg1', content: 'Original', role: 'user' })
    })

    act(() => {
      result.current.setEditingMessageContent('Updated content')
    })

    expect(result.current.editingMessageContent).toBe('Updated content')
  })

  it('should clear input after preparing to send', () => {
    const { result } = renderHook(() => useChat())

    act(() => {
      result.current.setInputValue('Test message')
    })

    act(() => {
      result.current.prepareToSend()
    })

    expect(result.current.inputValue).toBe('')
    expect(result.current.sending).toBe(true)
  })

  it('should reset state after send complete', () => {
    const { result } = renderHook(() => useChat())

    act(() => {
      result.current.setSending(true)
      result.current.setRegeneratingMessageId('msg1')
    })

    act(() => {
      result.current.resetAfterSend()
    })

    expect(result.current.sending).toBe(false)
    expect(result.current.regeneratingMessageId).toBeNull()
  })

  it('should get latest assistant message ID', () => {
    const { result } = renderHook(() => useChat())

    const messages = [
      { id: 'msg1', role: 'user' as const, content: 'Hello' },
      { id: 'msg2', role: 'assistant' as const, content: 'Hi there' },
      { id: 'msg3', role: 'user' as const, content: 'How are you?' },
      { id: 'msg4', role: 'assistant' as const, content: 'I am fine' },
    ]

    const latestId = result.current.getLatestAssistantMessageId(messages)
    expect(latestId).toBe('msg4')
  })

  it('should return null if no assistant message exists', () => {
    const { result } = renderHook(() => useChat())

    const messages = [
      { id: 'msg1', role: 'user' as const, content: 'Hello' },
    ]

    const latestId = result.current.getLatestAssistantMessageId(messages)
    expect(latestId).toBeNull()
  })
})
