import type { AIProvider } from '../store/aiChatStore'

const DEEPSEEK_API_URL = 'https://api.deepseek.com/chat/completions'

interface AISettings {
  provider: AIProvider
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
    deepseek: 'DeepSeek',
    grok: 'Grok',
    claude: 'Claude'
  }
  return map[provider] ?? provider
}

/**
 * 判断模型是否是 Grok 模型
 */
export const isGrokModel = (modelName: string): boolean => {
  return modelName?.startsWith('grok')
}

/**
 * 判断模型是否是 Claude 模型
 */
export const isClaudeModel = (modelName: string): boolean => {
  return modelName?.startsWith('claude')
}

/**
 * 修复本地地址问题
 * 当检测到 127.0.0.1 或 localhost 时，自动替换为当前访问的 hostname
 * 这样手机端也能正常访问代理服务
 */
export const fixLocalUrl = (url: string): string => {
  if (!url) return url

  const trimmed = url.trim()
  const hasScheme = /^[a-zA-Z][a-zA-Z\d+.-]*:\/\//.test(trimmed)
  const normalized = hasScheme ? trimmed : `http://${trimmed}`
  const removeTrailingSlash = (value: string): string => value.replace(/\/+$/, '')

  try {
    const urlObj = new URL(normalized)
    // 检测是否是本地地址
    if (urlObj.hostname === '127.0.0.1' || urlObj.hostname === 'localhost') {
      // 在浏览器环境中替换为当前页面的 hostname
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

const PRIVATE_IP_PATTERN = /^(10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[01])\.)/

const resolveProviderBaseUrl = (rawBaseUrl: string | undefined, fallbackBaseUrl: string): string => {
  const fallbackNormalized = fixLocalUrl(fallbackBaseUrl)
  const candidate = rawBaseUrl?.trim()
  const normalized = fixLocalUrl(candidate || fallbackBaseUrl)

  try {
    const urlObj = new URL(normalized)
    const isLocalhost = urlObj.hostname === '127.0.0.1' || urlObj.hostname === 'localhost'
    const isPrivateIp = PRIVATE_IP_PATTERN.test(urlObj.hostname)
    const isSingleLabelHost = !urlObj.hostname.includes('.') && !isLocalhost
    const isRootPath = !urlObj.pathname || urlObj.pathname === '/'
    const missingPort = !urlObj.port

    // 局域网代理场景下，如果只填了主机名/IP 且没端口，会导致容器内无法访问，回退到默认值。
    if ((isSingleLabelHost || isPrivateIp || isLocalhost) && missingPort && isRootPath) {
      return fallbackNormalized
    }
  } catch {
    return fallbackNormalized
  }

  return normalized
}

const buildChatCompletionsUrl = (rawBaseUrl: string | undefined, fallbackBaseUrl: string): string => {
  const baseUrl = resolveProviderBaseUrl(rawBaseUrl, fallbackBaseUrl).replace(/\/+$/, '')
  if (baseUrl.endsWith('/chat/completions')) {
    return baseUrl
  }
  return `${baseUrl}/chat/completions`
}

/**
 * 获取 API 配置 - 根据角色选择的模型自动判断
 */
export const getApiConfig = (settings: AISettings, characterModel?: string): ApiConfig => {
  const useClaudeApi = characterModel ? isClaudeModel(characterModel) : (settings.provider === 'claude')
  const useGrokApi = characterModel ? isGrokModel(characterModel) : (settings.provider === 'grok')

  if (useClaudeApi) {
    const url = buildChatCompletionsUrl(settings.claudeBaseUrl, 'https://api.duojie.games/v1')
    return {
      url,
      apiKey: settings.claudeApiKey || '',
      model: characterModel || settings.claudeModel || 'claude-sonnet-4-6',
      provider: 'claude'
    }
  }

  if (useGrokApi) {
    const url = buildChatCompletionsUrl(settings.grokBaseUrl, 'http://localhost:8000/v1')
    return {
      url,
      apiKey: settings.grokApiKey || '',
      model: characterModel || settings.grokModel || 'grok-4-1-fast-non-reasoning',
      provider: 'grok'
    }
  }

  return {
    url: DEEPSEEK_API_URL,
    apiKey: settings.deepseekApiKey || settings.apiKey || '',
    model: characterModel || settings.deepseekModel || 'deepseek-v4-flash',
    provider: 'deepseek'
  }
}
