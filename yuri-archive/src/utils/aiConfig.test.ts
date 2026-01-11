import { describe, it, expect } from 'vitest'
import { getApiConfig, isQwenModel, isGeminiModel } from './aiConfig'

describe('aiConfig', () => {
  describe('isQwenModel', () => {
    it('should return true for qwen models', () => {
      expect(isQwenModel('qwen3-max')).toBe(true)
      expect(isQwenModel('qwen3-turbo')).toBe(true)
      expect(isQwenModel('qwen-plus')).toBe(true)
    })

    it('should return false for non-qwen models', () => {
      expect(isQwenModel('deepseek-chat')).toBe(false)
      expect(isQwenModel('claude-opus-4-5-thinking')).toBe(false)
      expect(isQwenModel('')).toBe(false)
    })
  })

  describe('isGeminiModel', () => {
    it('should return true for gemini models', () => {
      expect(isGeminiModel('gemini-3-pro-high')).toBe(true)
      expect(isGeminiModel('gemini-pro')).toBe(true)
    })

    it('should return false for non-gemini models', () => {
      expect(isGeminiModel('deepseek-chat')).toBe(false)
      expect(isGeminiModel('claude-opus-4-5-thinking')).toBe(false)
      expect(isGeminiModel('')).toBe(false)
    })
  })

  describe('getApiConfig', () => {
    const mockSettings = {
      provider: 'deepseek' as const,
      deepseekApiKey: 'deepseek-key',
      deepseekModel: 'deepseek-chat',
      claudeApiKey: 'claude-key',
      claudeBaseUrl: 'http://127.0.0.1:8045/v1',
      claudeModel: 'claude-opus-4-5-thinking',
      qwenApiKey: 'qwen-key',
      qwenBaseUrl: 'http://localhost:8317/v1',
      qwenModel: 'qwen3-max',
      gptApiKey: 'gpt-key',
      gptBaseUrl: 'http://localhost:8317/v1',
      gptModel: 'gpt-5.2',
      geminiApiKey: 'gemini-key',
      geminiBaseUrl: 'http://127.0.0.1:8045/v1',
      geminiModel: 'gemini-3-pro-high',
      apiKey: '',
      defaultModel: 'deepseek-chat'
    }

    it('should return qwen config when character model is qwen', () => {
      const config = getApiConfig(mockSettings, 'qwen3-max')
      expect(config.provider).toBe('qwen')
      expect(config.apiKey).toBe('qwen-key')
      expect(config.model).toBe('qwen3-max')
      expect(config.url).toBe('http://localhost:8317/v1/chat/completions')
    })

    it('should return qwen config when provider is qwen', () => {
      const qwenSettings = { ...mockSettings, provider: 'qwen' as const }
      const config = getApiConfig(qwenSettings)
      expect(config.provider).toBe('qwen')
      expect(config.apiKey).toBe('qwen-key')
      expect(config.model).toBe('qwen3-max')
    })

    it('should return claude config when character model is claude', () => {
      const config = getApiConfig(mockSettings, 'claude-opus-4-5-thinking')
      expect(config.provider).toBe('claude')
      expect(config.apiKey).toBe('claude-key')
    })

    it('should return deepseek config by default', () => {
      const config = getApiConfig(mockSettings)
      expect(config.provider).toBe('deepseek')
      expect(config.apiKey).toBe('deepseek-key')
    })

    it('should return gemini config when character model is gemini', () => {
      const config = getApiConfig(mockSettings, 'gemini-3-pro-high')
      expect(config.provider).toBe('gemini')
      expect(config.apiKey).toBe('gemini-key')
      expect(config.model).toBe('gemini-3-pro-high')
      expect(config.url).toContain('/chat/completions')
    })

    it('should return gemini config when provider is gemini', () => {
      const geminiSettings = { ...mockSettings, provider: 'gemini' as const }
      const config = getApiConfig(geminiSettings)
      expect(config.provider).toBe('gemini')
      expect(config.apiKey).toBe('gemini-key')
      expect(config.model).toBe('gemini-3-pro-high')
    })
  })
})
