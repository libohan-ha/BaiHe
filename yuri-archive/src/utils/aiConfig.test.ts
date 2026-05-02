import { describe, it, expect } from 'vitest'
import { getApiConfig, fixLocalUrl, isGrokModel } from './aiConfig'

describe('aiConfig', () => {
  describe('isGrokModel', () => {
    it('should return true for grok models', () => {
      expect(isGrokModel('grok-4-1-fast-non-reasoning')).toBe(true)
      expect(isGrokModel('grok')).toBe(true)
    })

    it('should return false for non-grok models', () => {
      expect(isGrokModel('gpt-5.2')).toBe(false)
      expect(isGrokModel('deepseek-chat')).toBe(false)
      expect(isGrokModel('')).toBe(false)
    })
  })

  describe('fixLocalUrl', () => {
    it('should auto prepend http scheme when missing', () => {
      expect(fixLocalUrl('libohan/v1')).toBe('http://libohan/v1')
    })

    it('should remove trailing slashes to avoid malformed endpoint join', () => {
      expect(fixLocalUrl('http://libohan/')).toBe('http://libohan')
      expect(fixLocalUrl('http://localhost:8045/v1/')).toBe('http://localhost:8045/v1')
    })
  })

  describe('getApiConfig', () => {
    const mockSettings = {
      provider: 'deepseek' as const,
      deepseekApiKey: 'deepseek-key',
      deepseekModel: 'deepseek-v4-flash',
      grokApiKey: 'grok-key',
      grokBaseUrl: 'http://localhost:8000/v1',
      grokModel: 'grok-4-1-fast-non-reasoning',
      apiKey: '',
      defaultModel: 'deepseek-v4-flash'
    }

    it('should return deepseek config by default', () => {
      const config = getApiConfig(mockSettings)
      expect(config.provider).toBe('deepseek')
      expect(config.apiKey).toBe('deepseek-key')
    })

    it('should return grok config when character model is grok', () => {
      const config = getApiConfig(mockSettings, 'grok-4-1-fast-non-reasoning')
      expect(config.provider).toBe('grok')
      expect(config.apiKey).toBe('grok-key')
      expect(config.model).toBe('grok-4-1-fast-non-reasoning')
      expect(config.url).toBe('http://localhost:8000/v1/chat/completions')
    })

    it('should return grok config when provider is grok', () => {
      const grokSettings = { ...mockSettings, provider: 'grok' as const }
      const config = getApiConfig(grokSettings)
      expect(config.provider).toBe('grok')
      expect(config.apiKey).toBe('grok-key')
      expect(config.model).toBe('grok-4-1-fast-non-reasoning')
    })

    it('should fallback to deepseek for unknown model', () => {
      const config = getApiConfig(mockSettings, 'unknown-model')
      expect(config.provider).toBe('deepseek')
      expect(config.model).toBe('unknown-model')
    })
  })
})
