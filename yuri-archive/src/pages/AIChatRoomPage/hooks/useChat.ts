import { useState, useCallback } from 'react'
import type { ChatMessage } from '../../../types'

interface EditableMessage {
  id: string
  content: string
  role: string
}

export function useChat() {
  const [inputValue, setInputValue] = useState('')
  const [sending, setSending] = useState(false)
  const [regeneratingMessageId, setRegeneratingMessageId] = useState<string | null>(null)
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
  const [editingMessageContent, setEditingMessageContent] = useState('')

  // 开始编辑消息
  const startEditMessage = useCallback((msg: EditableMessage) => {
    setEditingMessageId(msg.id)
    setEditingMessageContent(msg.content)
  }, [])

  // 取消编辑
  const cancelEditMessage = useCallback(() => {
    setEditingMessageId(null)
    setEditingMessageContent('')
  }, [])

  // 准备发送（清空输入，设置发送状态）
  const prepareToSend = useCallback(() => {
    setInputValue('')
    setSending(true)
  }, [])

  // 发送完成后重置状态
  const resetAfterSend = useCallback(() => {
    setSending(false)
    setRegeneratingMessageId(null)
  }, [])

  // 获取最新的AI消息ID
  const getLatestAssistantMessageId = useCallback((messages: ChatMessage[]) => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'assistant') {
        return messages[i].id
      }
    }
    return null
  }, [])

  return {
    inputValue,
    setInputValue,
    sending,
    setSending,
    regeneratingMessageId,
    setRegeneratingMessageId,
    editingMessageId,
    setEditingMessageId,
    editingMessageContent,
    setEditingMessageContent,
    startEditMessage,
    cancelEditMessage,
    prepareToSend,
    resetAfterSend,
    getLatestAssistantMessageId,
  }
}
