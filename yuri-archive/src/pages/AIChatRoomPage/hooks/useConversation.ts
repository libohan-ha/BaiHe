import { useState, useCallback } from 'react'
import {
  getConversations,
  getChatMessages,
  createConversation,
  deleteConversation,
  updateConversation,
} from '../../../services/api'
import type { Conversation, ChatMessage } from '../../../types'

export function useConversation(characterId: string) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])

  // 获取保存的对话ID
  const getSavedConversationId = useCallback(() => {
    return localStorage.getItem(`ai-chat-conv-${characterId}`)
  }, [characterId])

  // 保存当前对话ID
  const saveConversationId = useCallback((convId: string) => {
    localStorage.setItem(`ai-chat-conv-${characterId}`, convId)
  }, [characterId])

  // 加载对话列表
  const loadConversations = useCallback(async () => {
    const convs = await getConversations(characterId)
    setConversations(convs)

    if (convs.length > 0) {
      // 优先恢复之前的对话
      const savedConvId = getSavedConversationId()
      const savedConv = savedConvId ? convs.find(c => c.id === savedConvId) : null
      const targetConv = savedConv || convs[0]

      setCurrentConversation(targetConv)
      saveConversationId(targetConv.id)

      const msgs = await getChatMessages(targetConv.id)
      setMessages(msgs)
    }
  }, [characterId, getSavedConversationId, saveConversationId])

  // 切换对话
  const switchConversation = useCallback(async (conv: Conversation) => {
    setCurrentConversation(conv)
    saveConversationId(conv.id)

    const msgs = await getChatMessages(conv.id)
    setMessages(msgs)
  }, [saveConversationId])

  // 创建新对话
  const createNewConversation = useCallback(async () => {
    const conv = await createConversation(characterId)
    setConversations(prev => [conv, ...prev])
    setCurrentConversation(conv)
    setMessages([])
    saveConversationId(conv.id)
    return conv
  }, [characterId, saveConversationId])

  // 删除对话
  const deleteConv = useCallback(async (convId: string) => {
    await deleteConversation(convId)
    const newConversations = conversations.filter(c => c.id !== convId)
    setConversations(newConversations)

    // 如果删除的是当前对话，切换到第一个对话或创建新对话
    if (currentConversation?.id === convId) {
      if (newConversations.length > 0) {
        await switchConversation(newConversations[0])
      } else {
        await createNewConversation()
      }
    }
  }, [conversations, currentConversation, switchConversation, createNewConversation])

  // 更新对话标题
  const updateTitle = useCallback(async (convId: string, title: string) => {
    const updated = await updateConversation(convId, title)
    setConversations(prev => prev.map(c =>
      c.id === convId ? { ...c, title: updated.title } : c
    ))
    if (currentConversation?.id === convId) {
      setCurrentConversation(prev => prev ? { ...prev, title: updated.title } : null)
    }
  }, [currentConversation])

  // 添加消息
  const addMessage = useCallback((message: ChatMessage) => {
    setMessages(prev => [...prev, message])
  }, [])

  // 更新消息
  const updateMessage = useCallback((messageId: string, updates: Partial<ChatMessage>) => {
    setMessages(prev => prev.map(msg =>
      msg.id === messageId ? { ...msg, ...updates } : msg
    ))
  }, [])

  // 删除消息（从指定消息开始）
  const deleteMessagesFrom = useCallback((messageId: string) => {
    setMessages(prev => {
      const index = prev.findIndex(m => m.id === messageId)
      return index >= 0 ? prev.slice(0, index) : prev
    })
  }, [])

  return {
    conversations,
    setConversations,
    currentConversation,
    setCurrentConversation,
    messages,
    setMessages,
    loadConversations,
    switchConversation,
    createNewConversation,
    deleteConv,
    updateTitle,
    addMessage,
    updateMessage,
    deleteMessagesFrom,
    saveConversationId,
  }
}
