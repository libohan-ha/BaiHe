import { describe, it, expect } from 'vitest'
import { getApiConfig, isQwenModel, isGeminiModel, isGeminiPreviewModel, isKimiModel, isMinimaxModel, isGlmModel } from './aiConfig'

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
      expect(isGeminiModel('gemini-3-pro-preview')).toBe(true)
      expect(isGeminiModel('gemini-pro')).toBe(true)
    })

    it('should return false for non-gemini models', () => {
      expect(isGeminiModel('deepseek-chat')).toBe(false)
      expect(isGeminiModel('claude-opus-4-5-thinking')).toBe(false)
      expect(isGeminiModel('')).toBe(false)
    })
  })

  describe('isGeminiPreviewModel', () => {
    it('should return true for gemini preview model', () => {
      expect(isGeminiPreviewModel('gemini-3-pro-preview')).toBe(true)
    })

    it('should return false for non-gemini preview models', () => {
      expect(isGeminiPreviewModel('gemini-3-pro-high')).toBe(false)
      expect(isGeminiPreviewModel('gemini-pro')).toBe(false)
      expect(isGeminiPreviewModel('')).toBe(false)
    })
  })

  describe('isKimiModel', () => {
    it('should return true for kimi models', () => {
      expect(isKimiModel('kimi-k2-0905')).toBe(true)
      expect(isKimiModel('kimi')).toBe(true)
    })

    it('should return false for non-kimi models', () => {
      expect(isKimiModel('qwen3-max')).toBe(false)
      expect(isKimiModel('deepseek-chat')).toBe(false)
      expect(isKimiModel('')).toBe(false)
    })
  })

  describe('isMinimaxModel', () => {
    it('should return true for minimax models', () => {
      expect(isMinimaxModel('minimax-m2.1')).toBe(true)
      expect(isMinimaxModel('minimax-m2')).toBe(true)
    })

    it('should return false for non-minimax models', () => {
      expect(isMinimaxModel('deepseek-chat')).toBe(false)
      expect(isMinimaxModel('glm-4.7')).toBe(false)
      expect(isMinimaxModel('')).toBe(false)
    })
  })

  describe('isGlmModel', () => {
    it('should return true for glm models', () => {
      expect(isGlmModel('glm-4.7')).toBe(true)
      expect(isGlmModel('glm-4.6')).toBe(true)
    })

    it('should return false for non-glm models', () => {
      expect(isGlmModel('deepseek-chat')).toBe(false)
      expect(isGlmModel('minimax-m2.1')).toBe(false)
      expect(isGlmModel('')).toBe(false)
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
      qwenBaseUrl: 'http://118.178.253.190:8317/v1',
      qwenModel: 'qwen3-max',
      gptApiKey: 'gpt-key',
      gptBaseUrl: 'http://localhost:8317/v1',
      gptModel: 'gpt-5.2',
      geminiApiKey: 'gemini-key',
      geminiBaseUrl: 'http://127.0.0.1:8045/v1',
      geminiModel: 'gemini-3-pro-high',
      geminiPreviewApiKey: 'gemini-preview-key',
      geminiPreviewBaseUrl: 'http://localhost:8317/v1',
      geminiPreviewModel: 'gemini-3-pro-preview',
      kimiApiKey: 'kimi-key',
      kimiBaseUrl: 'http://118.178.253.190:8317/v1',
      kimiModel: 'kimi-k2-0905',
      deepseekV3ApiKey: 'deepseekv3-key',
      deepseekV3BaseUrl: 'http://118.178.253.190:8317/v1',
      deepseekV3Model: 'deepseek-v3.2-chat',
      qwenCoderApiKey: 'qwencoder-key',
      qwenCoderBaseUrl: 'http://118.178.253.190:8317/v1',
      qwenCoderModel: 'qwen3-coder-plus',
      minimaxApiKey: 'minimax-key',
      minimaxBaseUrl: 'http://118.178.253.190:8317/v1',
      minimaxModel: 'minimax-m2.1',
      glmApiKey: 'glm-key',
      glmBaseUrl: 'http://118.178.253.190:8317/v1',
      glmModel: 'glm-4.7',
      apiKey: '',
      defaultModel: 'deepseek-chat'
    }

    it('should return qwen config when character model is qwen', () => {
      const config = getApiConfig(mockSettings, 'qwen3-max')
      expect(config.provider).toBe('qwen')
      expect(config.apiKey).toBe('qwen-key')
      expect(config.model).toBe('qwen3-max')
      expect(config.url).toBe('http://118.178.253.190:8317/v1/chat/completions')
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

    it('should return gemini preview config when character model is gemini-3-pro-preview', () => {
      const config = getApiConfig(mockSettings, 'gemini-3-pro-preview')
      expect(config.provider).toBe('geminiPreview')
      expect(config.apiKey).toBe('gemini-preview-key')
      expect(config.model).toBe('gemini-3-pro-preview')
      expect(config.url).toBe('http://localhost:8317/v1/chat/completions')
    })

    it('should return kimi config when character model is kimi', () => {
      const config = getApiConfig(mockSettings, 'kimi-k2-0905')
      expect(config.provider).toBe('kimi')
      expect(config.apiKey).toBe('kimi-key')
      expect(config.model).toBe('kimi-k2-0905')
      expect(config.url).toBe('http://118.178.253.190:8317/v1/chat/completions')
    })

    it('should return gemini config when provider is gemini', () => {
      const geminiSettings = { ...mockSettings, provider: 'gemini' as const }
      const config = getApiConfig(geminiSettings)
      expect(config.provider).toBe('gemini')
      expect(config.apiKey).toBe('gemini-key')
      expect(config.model).toBe('gemini-3-pro-high')
    })

    it('should return minimax config when character model is minimax', () => {
      const config = getApiConfig(mockSettings, 'minimax-m2.1')
      expect(config.provider).toBe('minimax')
      expect(config.apiKey).toBe('minimax-key')
      expect(config.model).toBe('minimax-m2.1')
      expect(config.url).toBe('http://118.178.253.190:8317/v1/chat/completions')
    })

    it('should return glm config when character model is glm', () => {
      const config = getApiConfig(mockSettings, 'glm-4.7')
      expect(config.provider).toBe('glm')
      expect(config.apiKey).toBe('glm-key')
      expect(config.model).toBe('glm-4.7')
      expect(config.url).toBe('http://118.178.253.190:8317/v1/chat/completions')
    })
  })
})
