/**
 * DeepSeek API 服务
 * 用于与 DeepSeek AI 模型进行对话
 */

const DEEPSEEK_API_URL = 'https://api.deepseek.com/chat/completions';

/**
 * 调用 DeepSeek API 进行对话
 * @param {Object} params - 请求参数
 * @param {string} params.apiKey - DeepSeek API Key
 * @param {string} params.model - 模型名称 (如 'deepseek-chat')
 * @param {Array} params.messages - 消息历史数组
 * @param {string} params.systemPrompt - 系统提示词
 * @returns {Promise<string>} AI 回复内容
 */
const chat = async ({ apiKey, model, messages, systemPrompt }) => {
  if (!apiKey) {
    throw new Error('DeepSeek API Key 未配置');
  }

  // 构建消息数组，首先添加系统提示词
  const formattedMessages = [];
  
  if (systemPrompt) {
    formattedMessages.push({
      role: 'system',
      content: systemPrompt
    });
  }

  // 添加历史消息
  messages.forEach(msg => {
    formattedMessages.push({
      role: msg.role,
      content: msg.content
    });
  });

  const response = await fetch(DEEPSEEK_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: model || 'deepseek-chat',
      messages: formattedMessages,
      stream: false
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `DeepSeek API 请求失败: ${response.status}`);
  }

  const data = await response.json();
  
  if (!data.choices || !data.choices[0] || !data.choices[0].message) {
    throw new Error('DeepSeek API 返回格式错误');
  }

  return data.choices[0].message.content;
};

/**
 * 流式调用 DeepSeek API
 * @param {Object} params - 请求参数
 * @param {string} params.apiKey - DeepSeek API Key
 * @param {string} params.model - 模型名称
 * @param {Array} params.messages - 消息历史数组
 * @param {string} params.systemPrompt - 系统提示词
 * @param {Function} params.onChunk - 接收到数据块时的回调
 * @returns {Promise<string>} 完整的AI回复内容
 */
const chatStream = async ({ apiKey, model, messages, systemPrompt, onChunk }) => {
  if (!apiKey) {
    throw new Error('DeepSeek API Key 未配置');
  }

  const formattedMessages = [];
  
  if (systemPrompt) {
    formattedMessages.push({
      role: 'system',
      content: systemPrompt
    });
  }

  messages.forEach(msg => {
    formattedMessages.push({
      role: msg.role,
      content: msg.content
    });
  });

  const response = await fetch(DEEPSEEK_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: model || 'deepseek-chat',
      messages: formattedMessages,
      stream: true
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `DeepSeek API 请求失败: ${response.status}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let fullContent = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value, { stream: true });
    const lines = chunk.split('\n').filter(line => line.trim() !== '');

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6);
        if (data === '[DONE]') continue;
        
        try {
          const parsed = JSON.parse(data);
          const content = parsed.choices?.[0]?.delta?.content || '';
          if (content) {
            fullContent += content;
            if (onChunk) onChunk(content);
          }
        } catch (e) {
          // 忽略解析错误
        }
      }
    }
  }

  return fullContent;
};

module.exports = {
  chat,
  chatStream
};

