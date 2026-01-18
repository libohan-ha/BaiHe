import type { AIProvider } from '../store/aiChatStore'

const DEEPSEEK_API_URL = 'https://api.deepseek.com/chat/completions'

interface AISettings {
  provider: AIProvider
  deepseekApiKey: string
  deepseekModel: string
  claudeApiKey: string
  claudeBaseUrl: string
  claudeModel: string
  qwenApiKey: string
  qwenBaseUrl: string
  qwenModel: string
  gptApiKey: string
  gptBaseUrl: string
  gptModel: string
  geminiApiKey: string
  geminiBaseUrl: string
  geminiModel: string
  deepseekV3ApiKey: string
  deepseekV3BaseUrl: string
  deepseekV3Model: string
  qwenCoderApiKey: string
  qwenCoderBaseUrl: string
  qwenCoderModel: string
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
    claude: 'Claude',
    qwen: 'Qwen',
    gpt: 'GPT',
    gemini: 'Gemini',
    deepseekV3: 'DeepSeek V3',
    qwenCoder: 'Qwen Coder'
  }
  return map[provider] ?? provider
}

/**
 * 判断模型是否是 Claude 模型
 */
export const isClaudeModel = (modelName: string): boolean => {
  return modelName?.startsWith('claude')
}

/**
 * 判断模型是否是 Qwen 模型
 */
export const isQwenModel = (modelName: string): boolean => {
  return modelName?.startsWith('qwen')
}

/**
 * 判断模型是否是 GPT 模型
 */
export const isGptModel = (modelName: string): boolean => {
  return modelName?.startsWith('gpt')
}

/**
 * 判断模型是否是 Gemini 模型
 */
export const isGeminiModel = (modelName: string): boolean => {
  return modelName?.startsWith('gemini')
}

/**
 * 判断模型是否是 DeepSeek V3 模型
 */
export const isDeepseekV3Model = (modelName: string): boolean => {
  return modelName?.startsWith('deepseek-v3')
}

/**
 * 判断模型是否是 Qwen Coder 模型
 */
export const isQwenCoderModel = (modelName: string): boolean => {
  return modelName?.startsWith('qwen3-coder')
}

/**
 * 修复本地地址问题
 * 当检测到 127.0.0.1 或 localhost 时，自动替换为当前访问的 hostname
 * 这样手机端也能正常访问代理服务
 */
export const fixLocalUrl = (url: string): string => {
  if (!url) return url

  try {
    const urlObj = new URL(url)
    // 检测是否是本地地址
    if (urlObj.hostname === '127.0.0.1' || urlObj.hostname === 'localhost') {
      // 在浏览器环境中替换为当前页面的 hostname
      if (typeof window !== 'undefined') {
        urlObj.hostname = window.location.hostname
      }
      return urlObj.toString()
    }
    return url
  } catch {
    return url
  }
}

/**
 * 获取 API 配置 - 根据角色选择的模型自动判断
 */
export const getApiConfig = (settings: AISettings, characterModel?: string): ApiConfig => {
  // 优先根据角色模型判断使用哪个 API
  const useClaudeApi = characterModel ? isClaudeModel(characterModel) : (settings.provider === 'claude')
  const useQwenApi = characterModel ? isQwenModel(characterModel) : (settings.provider === 'qwen')
  const useGptApi = characterModel ? isGptModel(characterModel) : (settings.provider === 'gpt')
  const useGeminiApi = characterModel ? isGeminiModel(characterModel) : (settings.provider === 'gemini')
  const useDeepseekV3Api = characterModel ? isDeepseekV3Model(characterModel) : (settings.provider === 'deepseekV3')
  const useQwenCoderApi = characterModel ? isQwenCoderModel(characterModel) : (settings.provider === 'qwenCoder')

  if (useQwenCoderApi) {
    const baseUrl = fixLocalUrl(settings.qwenCoderBaseUrl || 'http://118.178.253.190:8317/v1')
    return {
      url: `${baseUrl}/chat/completions`,
      apiKey: settings.qwenCoderApiKey || '',
      model: characterModel || settings.qwenCoderModel || 'qwen3-coder-plus',
      provider: 'qwenCoder'
    }
  }

  if (useDeepseekV3Api) {
    const baseUrl = fixLocalUrl(settings.deepseekV3BaseUrl || 'http://118.178.253.190:8317/v1')
    return {
      url: `${baseUrl}/chat/completions`,
      apiKey: settings.deepseekV3ApiKey || '',
      model: characterModel || settings.deepseekV3Model || 'deepseek-v3.2-chat',
      provider: 'deepseekV3'
    }
  }

  if (useGeminiApi) {
    const baseUrl = fixLocalUrl(settings.geminiBaseUrl || 'http://127.0.0.1:8045/v1')
    return {
      url: `${baseUrl}/chat/completions`,
      apiKey: settings.geminiApiKey || '',
      model: characterModel || settings.geminiModel || 'gemini-3-pro-high',
      provider: 'gemini'
    }
  }

  if (useGptApi) {
    const baseUrl = fixLocalUrl(settings.gptBaseUrl || 'http://localhost:8317/v1')
    return {
      url: `${baseUrl}/chat/completions`,
      apiKey: settings.gptApiKey || '',
      model: characterModel || settings.gptModel || 'gpt-5.2',
      provider: 'gpt'
    }
  }

  if (useQwenApi) {
    const baseUrl = fixLocalUrl(settings.qwenBaseUrl || 'http://118.178.253.190:8317/v1')
    return {
      url: `${baseUrl}/chat/completions`,
      apiKey: settings.qwenApiKey || '',
      model: characterModel || settings.qwenModel || 'qwen3-max',
      provider: 'qwen'
    }
  }

  if (useClaudeApi) {
    const baseUrl = fixLocalUrl(settings.claudeBaseUrl || 'http://127.0.0.1:8045/v1')
    return {
      url: `${baseUrl}/chat/completions`,
      apiKey: settings.claudeApiKey || '',
      model: characterModel || settings.claudeModel || 'claude-opus-4-5-thinking',
      provider: 'claude'
    }
  }

  return {
    url: DEEPSEEK_API_URL,
    apiKey: settings.deepseekApiKey || settings.apiKey || '',
    model: characterModel || settings.deepseekModel || 'deepseek-chat',
    provider: 'deepseek'
  }
}
