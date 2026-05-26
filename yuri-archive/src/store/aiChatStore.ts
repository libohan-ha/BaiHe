import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AICharacter, ChatMessage, Conversation } from '../types'

export type AIProvider =
  | 'deepseek'
  | 'grok'
  | 'claude'
  | 'custom'

export interface CustomApiCredential {
  id: string
  name: string
  baseUrl: string
  apiKey: string
  model: string
  models: string[]
  updatedAt: number
}

export type AIContextStrategy = 'summary_recent' | 'all'

interface AISettings {
  provider: AIProvider
  contextStrategy: AIContextStrategy
  contextMessageLimit: number
  activeCustomCredentialId: string
  customCredentials: CustomApiCredential[]
  customBaseUrl: string
  customApiKey: string
  customModel: string
  customModels: string[]
  // DeepSeek 设置
  deepseekApiKey: string
  deepseekModel: string
  // Grok 设置
  grokApiKey: string
  grokBaseUrl: string
  grokModel: string
  // Claude 设置
  claudeApiKey: string
  claudeBaseUrl: string
  claudeModel: string
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
    provider: 'custom' as AIProvider,
    contextStrategy: 'summary_recent' as AIContextStrategy,
    contextMessageLimit: 20,
    activeCustomCredentialId: '',
    customCredentials: [],
    customBaseUrl: '',
    customApiKey: '',
    customModel: '',
    customModels: [],
    // DeepSeek 设置
    deepseekApiKey: '',
    deepseekModel: 'deepseek-v4-flash',
    // Grok 设置
    grokApiKey: '',
    grokBaseUrl: 'http://localhost:8000/v1',
    grokModel: 'grok-4-1-fast-non-reasoning',
    // Claude 设置
    claudeApiKey: '',
    claudeBaseUrl: 'https://api.duojie.games/v1',
    claudeModel: 'claude-sonnet-4-6',
    // 兼容旧版本
    apiKey: '',
    defaultModel: 'deepseek-v4-flash'
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

const STORAGE_KEY = 'anime-archive-ai-chat'
const STORAGE_VERSION = 11

const normalizeBaseUrl = (value: unknown): string => {
  if (typeof value !== 'string') return ''
  const trimmed = value.trim()
  if (!trimmed) return ''
  const hasScheme = /^[a-zA-Z][a-zA-Z\d+.-]*:\/\//.test(trimmed)
  const withScheme = hasScheme ? trimmed : `http://${trimmed}`
  return withScheme.replace(/\/+$/, '')
}

const LEGACY_LOCAL_8317_BASE_URLS = new Set([
  'http://localhost:8317/v1',
  'http://127.0.0.1:8317/v1'
])

const LEGACY_INSECURE_API_KEYS = new Set([
  '123456',
  'sk-ace780b87a754995a3437a13518e99c9'
])

const BASE_URL_FIELDS = [
  'customBaseUrl',
  'grokBaseUrl',
  'claudeBaseUrl'
] as const satisfies ReadonlyArray<keyof AISettings>

const API_KEY_FIELDS = [
  'customApiKey',
  'deepseekApiKey',
  'grokApiKey',
  'claudeApiKey',
  'apiKey'
] as const satisfies ReadonlyArray<keyof AISettings>

const sanitizeApiKeys = (settings: AISettings): AISettings => {
  for (const key of API_KEY_FIELDS) {
    const value = settings[key]
    if (typeof value === 'string' && LEGACY_INSECURE_API_KEYS.has(value.trim())) {
      settings[key] = ''
    }
  }
  return settings
}

const sanitizeBaseUrls = (settings: AISettings): AISettings => {
  for (const key of BASE_URL_FIELDS) {
    const normalized = normalizeBaseUrl(settings[key])
    if (normalized) {
      settings[key] = normalized
    }
  }
  return settings
}

export const useAIChatStore = create<AIChatStore>()(
  persist(
    (set) => ({
      ...initialState,
      
      setSettings: (newSettings) => set((state) => {
        const mergedSettings: AISettings = { ...state.settings, ...newSettings }
        if (mergedSettings.contextStrategy !== 'all' && mergedSettings.contextStrategy !== 'summary_recent') {
          mergedSettings.contextStrategy = 'summary_recent'
        }
        if (!Number.isFinite(mergedSettings.contextMessageLimit) || mergedSettings.contextMessageLimit < 1) {
          mergedSettings.contextMessageLimit = 20
        }
        if (!Array.isArray(mergedSettings.customModels)) {
          mergedSettings.customModels = []
        }
        if (!Array.isArray(mergedSettings.customCredentials)) {
          mergedSettings.customCredentials = []
        }
        sanitizeBaseUrls(mergedSettings)
        return {
          settings: mergedSettings
        }
      }),
      
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

        if (!Array.isArray(mergedSettings.customModels)) {
          mergedSettings.customModels = []
        }

        if (!Array.isArray(mergedSettings.customCredentials)) {
          mergedSettings.customCredentials = []
        }

        if (mergedSettings.provider !== 'custom') {
          mergedSettings.provider = 'custom'
        }

        if (
          mergedSettings.customBaseUrl &&
          mergedSettings.customApiKey &&
          mergedSettings.customCredentials.length === 0
        ) {
          const migratedCredential: CustomApiCredential = {
            id: 'custom-migrated',
            name: '默认配置',
            baseUrl: mergedSettings.customBaseUrl,
            apiKey: mergedSettings.customApiKey,
            model: mergedSettings.customModel || mergedSettings.defaultModel || '',
            models: mergedSettings.customModels,
            updatedAt: Date.now()
          }
          mergedSettings.customCredentials = [migratedCredential]
          mergedSettings.activeCustomCredentialId = migratedCredential.id
        }

        for (const key of BASE_URL_FIELDS) {
          const raw = persistedSettings[key]
          const normalized = normalizeBaseUrl(raw)
          if (!normalized) {
            mergedSettings[key] = initialState.settings[key]
            continue
          }
          if (LEGACY_LOCAL_8317_BASE_URLS.has(normalized)) {
            mergedSettings[key] = initialState.settings[key]
            continue
          }
          mergedSettings[key] = normalized
        }

        sanitizeApiKeys(mergedSettings)
        sanitizeBaseUrls(mergedSettings)

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
