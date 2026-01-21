import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AICharacter, ChatMessage, Conversation } from '../types'

export type AIProvider = 'deepseek' | 'claude' | 'qwen' | 'gpt' | 'gemini' | 'deepseekV3' | 'qwenCoder' | 'minimax' | 'glm'

interface AISettings {
  provider: AIProvider
  // DeepSeek 设置
  deepseekApiKey: string
  deepseekModel: string
  // Claude 设置
  claudeApiKey: string
  claudeBaseUrl: string
  claudeModel: string
  // Qwen 设置
  qwenApiKey: string
  qwenBaseUrl: string
  qwenModel: string
  // GPT 设置
  gptApiKey: string
  gptBaseUrl: string
  gptModel: string
  // Gemini 设置
  geminiApiKey: string
  geminiBaseUrl: string
  geminiModel: string
  // DeepSeek V3 设置
  deepseekV3ApiKey: string
  deepseekV3BaseUrl: string
  deepseekV3Model: string
  // Qwen Coder 设置
  qwenCoderApiKey: string
  qwenCoderBaseUrl: string
  qwenCoderModel: string
  // Minimax 设置
  minimaxApiKey: string
  minimaxBaseUrl: string
  minimaxModel: string
  // GLM 设置
  glmApiKey: string
  glmBaseUrl: string
  glmModel: string
  // 兼容旧版本
  apiKey: string
  defaultModel: string
}

interface AIChatStore {
  // AI设置
  settings: AISettings
  setSettings: (settings: Partial<AISettings>) => void
  
  // 角色列表
  characters: AICharacter[]
  setCharacters: (characters: AICharacter[]) => void
  addCharacter: (character: AICharacter) => void
  updateCharacter: (id: string, character: Partial<AICharacter>) => void
  removeCharacter: (id: string) => void
  
  // 当前角色
  currentCharacter: AICharacter | null
  setCurrentCharacter: (character: AICharacter | null) => void
  
  // 对话列表
  conversations: Conversation[]
  setConversations: (conversations: Conversation[]) => void
  addConversation: (conversation: Conversation) => void
  removeConversation: (id: string) => void
  
  // 当前对话
  currentConversation: Conversation | null
  setCurrentConversation: (conversation: Conversation | null) => void
  
  // 消息列表
  messages: ChatMessage[]
  setMessages: (messages: ChatMessage[]) => void
  addMessage: (message: ChatMessage) => void
  
  // 加载状态
  isLoading: boolean
  setIsLoading: (loading: boolean) => void

  // 流式回复状态（跨路由保留）
  streamingContent: string
  streamingConversationId: string | null
  streamingMessageId: string | null
  isStreaming: boolean
  setStreamingState: (payload: { content?: string; conversationId?: string | null; messageId?: string | null; isStreaming?: boolean }) => void
  appendStreamingContent: (chunk: string) => void
  resetStreaming: () => void
  
  // 重置
  reset: () => void
}

const initialState = {
  settings: {
    provider: 'deepseek' as AIProvider,
    // DeepSeek 设置
    deepseekApiKey: '',
    deepseekModel: 'deepseek-chat',
    // Claude 设置
    claudeApiKey: 'sk-ace780b87a754995a3437a13518e99c9',
    claudeBaseUrl: 'http://127.0.0.1:8045/v1',
    claudeModel: 'claude-opus-4-5-thinking',
    // Qwen 设置
    qwenApiKey: '123456',
    qwenBaseUrl: 'http://118.178.253.190:8317/v1',
    qwenModel: 'qwen3-max',
    // GPT 设置
    gptApiKey: '123456',
    gptBaseUrl: 'http://localhost:8317/v1',
    gptModel: 'gpt-5.2',
    // Gemini 设置
    geminiApiKey: 'sk-ace780b87a754995a3437a13518e99c9',
    geminiBaseUrl: 'http://127.0.0.1:8045/v1',
    geminiModel: 'gemini-3-pro-high',
    // DeepSeek V3 设置
    deepseekV3ApiKey: '123456',
    deepseekV3BaseUrl: 'http://118.178.253.190:8317/v1',
    deepseekV3Model: 'deepseek-v3.2-chat',
    // Qwen Coder 设置
    qwenCoderApiKey: '123456',
    qwenCoderBaseUrl: 'http://118.178.253.190:8317/v1',
    qwenCoderModel: 'qwen3-coder-plus',
    // Minimax 设置
    minimaxApiKey: '123456',
    minimaxBaseUrl: 'http://118.178.253.190:8317/v1',
    minimaxModel: 'minimax-m2.1',
    // GLM 设置
    glmApiKey: '123456',
    glmBaseUrl: 'http://118.178.253.190:8317/v1',
    glmModel: 'glm-4.7',
    // 兼容旧版本
    apiKey: '',
    defaultModel: 'deepseek-chat'
  },
  characters: [],
  currentCharacter: null,
  conversations: [],
  currentConversation: null,
  messages: [],
  isLoading: false,
  streamingContent: '',
  streamingConversationId: null,
  streamingMessageId: null,
  isStreaming: false
}

const STORAGE_KEY = 'yuri-archive-ai-chat'
const STORAGE_VERSION = 1

const normalizeBaseUrl = (value: unknown): string => {
  if (typeof value !== 'string') return ''
  return value.trim().replace(/\/+$/, '')
}

const LEGACY_LOCAL_8317_BASE_URLS = new Set([
  'http://localhost:8317/v1',
  'http://127.0.0.1:8317/v1'
])

export const useAIChatStore = create<AIChatStore>()(
  persist(
    (set) => ({
      ...initialState,
      
      setSettings: (newSettings) => set((state) => ({
        settings: { ...state.settings, ...newSettings }
      })),
      
      setCharacters: (characters) => set({ characters }),
      
      addCharacter: (character) => set((state) => ({
        characters: [character, ...state.characters]
      })),
      
      updateCharacter: (id, updates) => set((state) => ({
        characters: state.characters.map(c => 
          c.id === id ? { ...c, ...updates } : c
        ),
        currentCharacter: state.currentCharacter?.id === id 
          ? { ...state.currentCharacter, ...updates }
          : state.currentCharacter
      })),
      
      removeCharacter: (id) => set((state) => ({
        characters: state.characters.filter(c => c.id !== id),
        currentCharacter: state.currentCharacter?.id === id 
          ? null 
          : state.currentCharacter
      })),
      
      setCurrentCharacter: (character) => set({ currentCharacter: character }),
      
      setConversations: (conversations) => set({ conversations }),
      
      addConversation: (conversation) => set((state) => ({
        conversations: [conversation, ...state.conversations]
      })),
      
      removeConversation: (id) => set((state) => ({
        conversations: state.conversations.filter(c => c.id !== id),
        currentConversation: state.currentConversation?.id === id 
          ? null 
          : state.currentConversation
      })),
      
      setCurrentConversation: (conversation) => set({ currentConversation: conversation }),
      
      setMessages: (messages) => set({ messages }),
      
      addMessage: (message) => set((state) => ({
        messages: [...state.messages, message]
      })),
      
      setIsLoading: (isLoading) => set({ isLoading }),

      setStreamingState: ({ content, conversationId, messageId, isStreaming }) => set((state) => ({
        streamingContent: content !== undefined ? content : state.streamingContent,
        streamingConversationId: conversationId !== undefined ? conversationId : state.streamingConversationId,
        streamingMessageId: messageId !== undefined ? messageId : state.streamingMessageId,
        isStreaming: isStreaming !== undefined ? isStreaming : state.isStreaming
      })),

      appendStreamingContent: (chunk) => set((state) => ({
        streamingContent: state.streamingContent + chunk
      })),

      resetStreaming: () => set({
        streamingContent: '',
        streamingConversationId: null,
        streamingMessageId: null,
        isStreaming: false
      }),
      
      reset: () => set({
        currentCharacter: null,
        conversations: [],
        currentConversation: null,
        messages: [],
        isLoading: false,
        streamingContent: '',
        streamingConversationId: null,
        streamingMessageId: null,
        isStreaming: false
      })
    }),
    {
      name: STORAGE_KEY,
      version: STORAGE_VERSION,
      migrate: (persistedState, version) => {
        if (version >= STORAGE_VERSION) return persistedState
        if (!persistedState || typeof persistedState !== 'object') {
          return { settings: initialState.settings }
        }

        const state = persistedState as { settings?: Partial<AISettings> }
        const persistedSettings = state.settings ?? {}
        const mergedSettings: AISettings = {
          ...initialState.settings,
          ...persistedSettings
        }

        const remoteBaseUrlKeys = [
          'qwenBaseUrl',
          'deepseekV3BaseUrl',
          'qwenCoderBaseUrl',
          'minimaxBaseUrl',
          'glmBaseUrl'
        ] as const satisfies ReadonlyArray<keyof AISettings>

        for (const key of remoteBaseUrlKeys) {
          const raw = persistedSettings[key]
          const normalized = normalizeBaseUrl(raw)
          if (!normalized || LEGACY_LOCAL_8317_BASE_URLS.has(normalized)) {
            mergedSettings[key] = initialState.settings[key]
          }
        }

        return {
          ...state,
          settings: mergedSettings
        }
      },
      partialize: (state) => ({
        settings: state.settings
      })
    }
  )
)
