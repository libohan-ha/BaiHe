import { describe, it, expect, beforeEach } from 'vitest'
import { useAIChatStore, type AIProvider } from './aiChatStore'

describe('aiChatStore', () => {
  beforeEach(() => {
    // 重置 store 状态
    useAIChatStore.getState().reset()
  })

  describe('AIProvider type', () => {
    it('should support deepseek provider', () => {
      const provider: AIProvider = 'deepseek'
      expect(provider).toBe('deepseek')
    })

    it('should support claude provider', () => {
      const provider: AIProvider = 'claude'
      expect(provider).toBe('claude')
    })

    it('should support qwen provider', () => {
      const provider: AIProvider = 'qwen'
      expect(provider).toBe('qwen')
    })

    it('should support gemini provider', () => {
      const provider: AIProvider = 'gemini'
      expect(provider).toBe('gemini')
    })
  })

  describe('settings', () => {
    it('should have qwen settings fields', () => {
      const { settings } = useAIChatStore.getState()
      expect(settings).toHaveProperty('qwenApiKey')
      expect(settings).toHaveProperty('qwenBaseUrl')
      expect(settings).toHaveProperty('qwenModel')
    })

    it('should have default qwen settings', () => {
      const { settings } = useAIChatStore.getState()
      expect(settings.qwenApiKey).toBe('123456')
      expect(settings.qwenBaseUrl).toBe('http://localhost:8317/v1')
      expect(settings.qwenModel).toBe('qwen3-max')
    })

    it('should update qwen settings', () => {
      const { setSettings } = useAIChatStore.getState()

      setSettings({
        provider: 'qwen',
        qwenApiKey: 'new-api-key',
        qwenBaseUrl: 'http://new-url:8000/v1',
        qwenModel: 'qwen3-turbo'
      })

      const { settings } = useAIChatStore.getState()
      expect(settings.provider).toBe('qwen')
      expect(settings.qwenApiKey).toBe('new-api-key')
      expect(settings.qwenBaseUrl).toBe('http://new-url:8000/v1')
      expect(settings.qwenModel).toBe('qwen3-turbo')
    })

    it('should have gemini settings fields', () => {
      const { settings } = useAIChatStore.getState()
      expect(settings).toHaveProperty('geminiApiKey')
      expect(settings).toHaveProperty('geminiBaseUrl')
      expect(settings).toHaveProperty('geminiModel')
    })

    it('should have default gemini settings', () => {
      const { settings } = useAIChatStore.getState()
      expect(settings.geminiApiKey).toBe('sk-ace780b87a754995a3437a13518e99c9')
      expect(settings.geminiBaseUrl).toBe('http://127.0.0.1:8045/v1')
      expect(settings.geminiModel).toBe('gemini-3-pro-high')
    })
  })
})
