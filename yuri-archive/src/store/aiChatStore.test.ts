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

    it('should support geminiPreview provider', () => {
      const provider: AIProvider = 'geminiPreview'
      expect(provider).toBe('geminiPreview')
    })

    it('should support kimi provider', () => {
      const provider: AIProvider = 'kimi'
      expect(provider).toBe('kimi')
    })

    it('should support minimax provider', () => {
      const provider: AIProvider = 'minimax'
      expect(provider).toBe('minimax')
    })

    it('should support glm provider', () => {
      const provider: AIProvider = 'glm'
      expect(provider).toBe('glm')
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
      expect(settings.qwenBaseUrl).toBe('http://118.178.253.190:8317/v1')
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

    it('should have gemini preview settings fields', () => {
      const { settings } = useAIChatStore.getState()
      expect(settings).toHaveProperty('geminiPreviewApiKey')
      expect(settings).toHaveProperty('geminiPreviewBaseUrl')
      expect(settings).toHaveProperty('geminiPreviewModel')
    })

    it('should have default gemini preview settings', () => {
      const { settings } = useAIChatStore.getState()
      expect(settings.geminiPreviewApiKey).toBe('123456')
      expect(settings.geminiPreviewBaseUrl).toBe('http://localhost:8317/v1')
      expect(settings.geminiPreviewModel).toBe('gemini-3-pro-preview')
    })

    it('should have kimi settings fields', () => {
      const { settings } = useAIChatStore.getState()
      expect(settings).toHaveProperty('kimiApiKey')
      expect(settings).toHaveProperty('kimiBaseUrl')
      expect(settings).toHaveProperty('kimiModel')
    })

    it('should have default kimi settings', () => {
      const { settings } = useAIChatStore.getState()
      expect(settings.kimiApiKey).toBe('123456')
      expect(settings.kimiBaseUrl).toBe('http://118.178.253.190:8317/v1')
      expect(settings.kimiModel).toBe('kimi-k2-0905')
    })

    it('should have minimax settings fields', () => {
      const { settings } = useAIChatStore.getState()
      expect(settings).toHaveProperty('minimaxApiKey')
      expect(settings).toHaveProperty('minimaxBaseUrl')
      expect(settings).toHaveProperty('minimaxModel')
    })

    it('should have default minimax settings', () => {
      const { settings } = useAIChatStore.getState()
      expect(settings.minimaxApiKey).toBe('123456')
      expect(settings.minimaxBaseUrl).toBe('http://118.178.253.190:8317/v1')
      expect(settings.minimaxModel).toBe('minimax-m2.1')
    })

    it('should have glm settings fields', () => {
      const { settings } = useAIChatStore.getState()
      expect(settings).toHaveProperty('glmApiKey')
      expect(settings).toHaveProperty('glmBaseUrl')
      expect(settings).toHaveProperty('glmModel')
    })

    it('should have default glm settings', () => {
      const { settings } = useAIChatStore.getState()
      expect(settings.glmApiKey).toBe('123456')
      expect(settings.glmBaseUrl).toBe('http://118.178.253.190:8317/v1')
      expect(settings.glmModel).toBe('glm-4.7')
    })
  })
})
