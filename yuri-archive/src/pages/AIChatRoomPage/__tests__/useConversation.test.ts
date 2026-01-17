import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useConversation } from '../hooks/useConversation'

// Mock API
vi.mock('../../../services/api', () => ({
  getConversations: vi.fn(),
  getChatMessages: vi.fn(),
  createConversation: vi.fn(),
  deleteConversation: vi.fn(),
  updateConversation: vi.fn(),
}))

import {
  getConversations,
  getChatMessages,
  createConversation,
  deleteConversation,
  updateConversation,
} from '../../../services/api'

const mockConversations = [
  { id: 'conv1', title: '对话1', characterId: 'char1', createdAt: '2024-01-01' },
  { id: 'conv2', title: '对话2', characterId: 'char1', createdAt: '2024-01-02' },
]

const mockMessages = [
  { id: 'msg1', role: 'user', content: 'Hello', conversationId: 'conv1' },
  { id: 'msg2', role: 'assistant', content: 'Hi there!', conversationId: 'conv1' },
]

describe('useConversation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('should initialize with empty state', () => {
    const { result } = renderHook(() => useConversation('char1'))

    expect(result.current.conversations).toEqual([])
    expect(result.current.currentConversation).toBeNull()
    expect(result.current.messages).toEqual([])
  })

  it('should load conversations and select first one', async () => {
    vi.mocked(getConversations).mockResolvedValue(mockConversations)
    vi.mocked(getChatMessages).mockResolvedValue(mockMessages)

    const { result } = renderHook(() => useConversation('char1'))

    await act(async () => {
      await result.current.loadConversations()
    })

    expect(result.current.conversations).toEqual(mockConversations)
    expect(result.current.currentConversation).toEqual(mockConversations[0])
    expect(result.current.messages).toEqual(mockMessages)
  })

  it('should create new conversation', async () => {
    const newConv = { id: 'conv3', title: '新对话', characterId: 'char1', createdAt: '2024-01-03' }
    vi.mocked(createConversation).mockResolvedValue(newConv)

    const { result } = renderHook(() => useConversation('char1'))

    await act(async () => {
      await result.current.createNewConversation()
    })

    expect(result.current.conversations).toContain(newConv)
    expect(result.current.currentConversation).toEqual(newConv)
    expect(result.current.messages).toEqual([])
  })

  it('should switch conversation and load messages', async () => {
    vi.mocked(getChatMessages).mockResolvedValue(mockMessages)

    const { result } = renderHook(() => useConversation('char1'))

    // Set initial conversations
    act(() => {
      result.current.setConversations(mockConversations)
    })

    await act(async () => {
      await result.current.switchConversation(mockConversations[1])
    })

    expect(result.current.currentConversation).toEqual(mockConversations[1])
    expect(getChatMessages).toHaveBeenCalledWith('conv2')
  })

  it('should delete conversation', async () => {
    vi.mocked(deleteConversation).mockResolvedValue(undefined)
    vi.mocked(getChatMessages).mockResolvedValue([])

    const { result } = renderHook(() => useConversation('char1'))

    // Set initial state
    act(() => {
      result.current.setConversations(mockConversations)
      result.current.setCurrentConversation(mockConversations[0])
    })

    await act(async () => {
      await result.current.deleteConv('conv1')
    })

    expect(deleteConversation).toHaveBeenCalledWith('conv1')
    expect(result.current.conversations).not.toContainEqual(mockConversations[0])
  })

  it('should update conversation title', async () => {
    const updatedConv = { ...mockConversations[0], title: '新标题' }
    vi.mocked(updateConversation).mockResolvedValue(updatedConv)

    const { result } = renderHook(() => useConversation('char1'))

    act(() => {
      result.current.setConversations(mockConversations)
      result.current.setCurrentConversation(mockConversations[0])
    })

    await act(async () => {
      await result.current.updateTitle('conv1', '新标题')
    })

    expect(updateConversation).toHaveBeenCalledWith('conv1', '新标题')
    expect(result.current.conversations[0].title).toBe('新标题')
    expect(result.current.currentConversation?.title).toBe('新标题')
  })

  it('should save conversation ID to localStorage', async () => {
    vi.mocked(getChatMessages).mockResolvedValue(mockMessages)

    const { result } = renderHook(() => useConversation('char1'))

    await act(async () => {
      await result.current.switchConversation(mockConversations[0])
    })

    expect(localStorage.getItem('ai-chat-conv-char1')).toBe('conv1')
  })

  it('should restore saved conversation from localStorage', async () => {
    localStorage.setItem('ai-chat-conv-char1', 'conv2')
    vi.mocked(getConversations).mockResolvedValue(mockConversations)
    vi.mocked(getChatMessages).mockResolvedValue(mockMessages)

    const { result } = renderHook(() => useConversation('char1'))

    await act(async () => {
      await result.current.loadConversations()
    })

    // Should load conv2 instead of conv1 because it was saved
    expect(result.current.currentConversation?.id).toBe('conv2')
  })

  it('should add message to messages list', () => {
    const { result } = renderHook(() => useConversation('char1'))

    const newMessage = { id: 'msg3', role: 'user' as const, content: 'Test', conversationId: 'conv1' }

    act(() => {
      result.current.addMessage(newMessage)
    })

    expect(result.current.messages).toContain(newMessage)
  })

  it('should update message in messages list', () => {
    const { result } = renderHook(() => useConversation('char1'))

    act(() => {
      result.current.setMessages(mockMessages)
    })

    act(() => {
      result.current.updateMessage('msg1', { content: 'Updated content' })
    })

    expect(result.current.messages[0].content).toBe('Updated content')
  })
})
