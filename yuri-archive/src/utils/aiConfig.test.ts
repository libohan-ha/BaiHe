import { describe, it, expect } from 'vitest'
import {
  buildOpenAIUrl,
  fixLocalUrl,
  getApiConfig,
  getSavedModelOptions,
  isGrokModel,
  normalizeOpenAIBaseUrl,
} from './aiConfig'

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

  describe('OpenAI-compatible urls', () => {
    it('should strip endpoint suffixes from base url', () => {
      expect(normalizeOpenAIBaseUrl('https://ai98pro.xyz/v1/chat/completions')).toBe('https://ai98pro.xyz/v1')
      expect(normalizeOpenAIBaseUrl('https://ai98pro.xyz/v1/models')).toBe('https://ai98pro.xyz/v1')
    })

    it('should build chat and models endpoints', () => {
      expect(buildOpenAIUrl('https://ai98pro.xyz/v1', 'chat/completions')).toBe('https://ai98pro.xyz/v1/chat/completions')
      expect(buildOpenAIUrl('https://ai98pro.xyz/v1/', 'models')).toBe('https://ai98pro.xyz/v1/models')
    })
  })

  describe('getApiConfig', () => {
    const mockSettings = {
      provider: 'custom' as const,
      customBaseUrl: 'https://ai98pro.xyz/v1',
      customApiKey: 'custom-key',
      customModel: 'gpt-5.4-mini',
      customModels: ['gpt-5.4-mini', 'gpt-5.5'],
      deepseekApiKey: 'deepseek-key',
      deepseekModel: 'deepseek-v4-flash',
      grokApiKey: 'grok-key',
      grokBaseUrl: 'http://localhost:8000/v1',
      grokModel: 'grok-4-1-fast-non-reasoning',
      claudeApiKey: 'claude-key',
      claudeBaseUrl: 'https://api.duojie.games/v1',
      claudeModel: 'claude-sonnet-4-6',
      apiKey: '',
      defaultModel: 'gpt-5.4-mini',
    }

    it('should return custom OpenAI-compatible config by default', () => {
      const config = getApiConfig(mockSettings)
      expect(config.provider).toBe('custom')
      expect(config.apiKey).toBe('custom-key')
      expect(config.model).toBe('gpt-5.4-mini')
      expect(config.url).toBe('https://ai98pro.xyz/v1/chat/completions')
    })

    it('should honor character model on the same custom endpoint', () => {
      const config = getApiConfig(mockSettings, 'gpt-5.5')
      expect(config.provider).toBe('custom')
      expect(config.apiKey).toBe('custom-key')
      expect(config.model).toBe('gpt-5.5')
    })

    it('should keep saved model options unique', () => {
      expect(getSavedModelOptions(mockSettings)).toEqual([
        'gpt-5.4-mini',
        'gpt-5.5',
        'deepseek-v4-flash',
        'grok-4-1-fast-non-reasoning',
        'claude-sonnet-4-6',
      ])
    })
  })
})
