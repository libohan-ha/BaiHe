import { describe, it, expect, beforeEach } from 'vitest'
import { useAIChatStore, type AIProvider } from './aiChatStore'

describe('aiChatStore', () => {
  beforeEach(() => {
    useAIChatStore.getState().reset()
  })

  describe('AIProvider type', () => {
    it('should support deepseek provider', () => {
      const provider: AIProvider = 'deepseek'
      expect(provider).toBe('deepseek')
    })

    it('should support grok provider', () => {
      const provider: AIProvider = 'grok'
      expect(provider).toBe('grok')
    })
  })

  describe('settings', () => {
    it('should have grok settings fields', () => {
      const { settings } = useAIChatStore.getState()
      expect(settings).toHaveProperty('grokApiKey')
      expect(settings).toHaveProperty('grokBaseUrl')
      expect(settings).toHaveProperty('grokModel')
    })

    it('should have default grok settings', () => {
      const { settings } = useAIChatStore.getState()
      expect(settings.grokApiKey).toBe('')
      expect(settings.grokBaseUrl).toBe('http://localhost:8000/v1')
      expect(settings.grokModel).toBe('grok-4-1-fast-non-reasoning')
    })

    it('should update grok settings', () => {
      const { setSettings } = useAIChatStore.getState()

      setSettings({
        provider: 'grok',
        grokApiKey: 'new-api-key',
        grokBaseUrl: 'http://new-url:8000/v1',
        grokModel: 'grok-new'
      })

      const { settings } = useAIChatStore.getState()
      expect(settings.provider).toBe('grok')
      expect(settings.grokApiKey).toBe('new-api-key')
      expect(settings.grokBaseUrl).toBe('http://new-url:8000/v1')
      expect(settings.grokModel).toBe('grok-new')
    })

    it('should normalize base url when saving settings', () => {
      const { setSettings } = useAIChatStore.getState()
      setSettings({
        grokBaseUrl: 'libohan/'
      })

      const { settings } = useAIChatStore.getState()
      expect(settings.grokBaseUrl).toBe('http://libohan')
    })
  })
})
