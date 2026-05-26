import type { AIProvider } from '../store/aiChatStore'

const DEFAULT_CUSTOM_MODEL = 'gpt-5.4-mini'

interface AISettings {
  provider: AIProvider
  activeCustomCredentialId: string
  customCredentials: Array<{
    id: string
    name: string
    baseUrl: string
    apiKey: string
    model: string
    models: string[]
    updatedAt: number
  }>
  customBaseUrl: string
  customApiKey: string
  customModel: string
  customModels: string[]
  deepseekApiKey: string
  deepseekModel: string
  grokApiKey: string
  grokBaseUrl: string
  grokModel: string
  claudeApiKey: string
  claudeBaseUrl: string
  claudeModel: string
  apiKey: string
  defaultModel: string
}

interface ApiConfig {
  url: string
  apiKey: string
  model: string
  provider: AIProvider
}

export const getProviderDisplayName = (provider: AIProvider): string => {
  const map: Record<AIProvider, string> = {
    custom: '自定义 OpenAI',
    deepseek: 'DeepSeek',
    grok: 'Grok',
    claude: 'Claude',
  }
  return map[provider] ?? provider
}

export const isGrokModel = (modelName: string): boolean => {
  return modelName?.startsWith('grok')
}

export const isClaudeModel = (modelName: string): boolean => {
  return modelName?.startsWith('claude')
}

export const fixLocalUrl = (url: string): string => {
  if (!url) return url

  const trimmed = url.trim()
  const hasScheme = /^[a-zA-Z][a-zA-Z\d+.-]*:\/\//.test(trimmed)
  const normalized = hasScheme ? trimmed : `http://${trimmed}`
  const removeTrailingSlash = (value: string): string => value.replace(/\/+$/, '')

  try {
    const urlObj = new URL(normalized)
    if (urlObj.hostname === '127.0.0.1' || urlObj.hostname === 'localhost') {
      if (typeof window !== 'undefined') {
        urlObj.hostname = window.location.hostname
      }
      return removeTrailingSlash(urlObj.toString())
    }
    return removeTrailingSlash(urlObj.toString())
  } catch {
    return url
  }
}

export const normalizeOpenAIBaseUrl = (rawBaseUrl: string): string => {
  const fixedUrl = fixLocalUrl(rawBaseUrl)
  return fixedUrl.replace(/\/(?:chat\/completions|models?)\/?$/i, '').replace(/\/+$/, '')
}

export const buildOpenAIUrl = (rawBaseUrl: string, path: 'chat/completions' | 'models'): string => {
  const baseUrl = normalizeOpenAIBaseUrl(rawBaseUrl)
  return `${baseUrl}/${path}`
}

export const getSavedModelOptions = (settings: AISettings): string[] => {
  const customCredentials = Array.isArray(settings.customCredentials) ? settings.customCredentials : []
  const activeCredential = customCredentials.find(item => item.id === settings.activeCustomCredentialId)
  const models = [
    ...(Array.isArray(activeCredential?.models) ? activeCredential.models : []),
    ...(Array.isArray(settings.customModels) ? settings.customModels : []),
    activeCredential?.model,
    settings.customModel,
    settings.defaultModel,
    settings.deepseekModel,
    settings.grokModel,
    settings.claudeModel,
  ]
  return [...new Set(models.filter((model): model is string => Boolean(model?.trim())))]
}

export const getDefaultModel = (settings: AISettings): string => {
  const customCredentials = Array.isArray(settings.customCredentials) ? settings.customCredentials : []
  const activeCredential = customCredentials.find(item => item.id === settings.activeCustomCredentialId)
  return activeCredential?.model || settings.customModel || settings.defaultModel || activeCredential?.models?.[0] || settings.customModels?.[0] || DEFAULT_CUSTOM_MODEL
}

export const getApiConfig = (settings: AISettings, characterModel?: string): ApiConfig => {
  const customCredentials = Array.isArray(settings.customCredentials) ? settings.customCredentials : []
  const activeCredential = customCredentials.find(item => item.id === settings.activeCustomCredentialId)
  const baseUrl = activeCredential?.baseUrl || settings.customBaseUrl || settings.grokBaseUrl || settings.claudeBaseUrl || 'https://api.openai.com/v1'
  return {
    url: buildOpenAIUrl(baseUrl, 'chat/completions'),
    apiKey: activeCredential?.apiKey || settings.customApiKey || settings.apiKey || settings.deepseekApiKey || settings.grokApiKey || settings.claudeApiKey || '',
    model: characterModel || getDefaultModel(settings),
    provider: 'custom',
  }
}
