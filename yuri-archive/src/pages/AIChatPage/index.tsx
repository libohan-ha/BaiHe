import { PlusOutlined, RobotOutlined, SettingOutlined, UploadOutlined } from '@ant-design/icons'
import type { UploadProps } from 'antd'
import { Avatar, Button, Form, Input, Modal, Radio, Select, Slider, Spin, Typography, Upload, message } from 'antd'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createAICharacter, deleteAICharacter, getAICharacters, getImageUrl, updateAICharacter, uploadAIChatImage } from '../../services/api'
import { useAIChatStore, useUserStore } from '../../store'
import type { AIProvider } from '../../store/aiChatStore'
import type { AICharacter, CreateCharacterData } from '../../types'
import styles from './AIChatPage.module.css'

const { Title } = Typography
const { TextArea } = Input

export function AIChatPage() {
  const [loading, setLoading] = useState(true)
  const [modalVisible, setModalVisible] = useState(false)
  const [settingsVisible, setSettingsVisible] = useState(false)
  const [editingCharacter, setEditingCharacter] = useState<AICharacter | null>(null)
  const [avatarUrl, setAvatarUrl] = useState<string>('')
  const [userAvatarUrl, setUserAvatarUrl] = useState<string>('')
  const [backgroundUrl, setBackgroundUrl] = useState<string>('')
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [userAvatarUploading, setUserAvatarUploading] = useState(false)
  const [backgroundUploading, setBackgroundUploading] = useState(false)
  const [form] = Form.useForm()
  const [settingsForm] = Form.useForm()
  const navigate = useNavigate()
  const { isLoggedIn } = useUserStore()
  const { characters, setCharacters, settings, setSettings } = useAIChatStore()

  useEffect(() => {
    if (!isLoggedIn) {
      message.warning('请先登录')
      navigate('/login')
      return
    }
    loadCharacters()
  }, [isLoggedIn])

  const loadCharacters = async () => {
    setLoading(true)
    try {
      const data = await getAICharacters()
      setCharacters(data)
    } catch (err) {
      message.error(err instanceof Error ? err.message : '加载失败')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setEditingCharacter(null)
    form.resetFields()
    setAvatarUrl('')
    setUserAvatarUrl('')
    setBackgroundUrl('')
    setModalVisible(true)
  }

  // 编辑角色（备用，可在卡片上添加编辑按钮时使用）
  const _handleEdit = (character: AICharacter, e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingCharacter(character)
    form.setFieldsValue({
      name: character.name,
      prompt: character.prompt,
      modelName: character.modelName,
      bubbleOpacity: character.bubbleOpacity ?? 85
    })
    setAvatarUrl(character.avatarUrl || '')
    setUserAvatarUrl(character.userAvatarUrl || '')
    setBackgroundUrl(character.backgroundUrl || '')
    setModalVisible(true)
  }
  // 使用 void 消除未使用警告
  void _handleEdit

  // 删除角色（备用，可在卡片上添加删除按钮时使用）
  const _handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    Modal.confirm({
      title: '确认删除',
      content: '删除后无法恢复，确定要删除这个角色吗？',
      onOk: async () => {
        try {
          await deleteAICharacter(id)
          message.success('删除成功')
          loadCharacters()
        } catch (err) {
          message.error(err instanceof Error ? err.message : '删除失败')
        }
      }
    })
  }
  // 使用 void 消除未使用警告
  void _handleDelete

  const handleSubmit = async (values: CreateCharacterData) => {
    try {
      const data = {
        ...values,
        avatarUrl: avatarUrl || undefined,
        userAvatarUrl: userAvatarUrl || undefined,
        backgroundUrl: backgroundUrl || undefined,
      }
      if (editingCharacter) {
        await updateAICharacter(editingCharacter.id, data)
        message.success('更新成功')
      } else {
        await createAICharacter(data)
        message.success('创建成功')
      }
      setModalVisible(false)
      loadCharacters()
    } catch (err) {
      message.error(err instanceof Error ? err.message : '操作失败')
    }
  }

  // 上传角色头像
  const handleAvatarUpload: UploadProps['customRequest'] = async (options) => {
    const { file, onSuccess, onError } = options
    setAvatarUploading(true)
    try {
      const result = await uploadAIChatImage(file as File, 'avatar')
      setAvatarUrl(result.url)
      onSuccess?.(result)
      message.success('角色头像上传成功')
    } catch (err) {
      onError?.(err as Error)
      message.error('上传失败')
    } finally {
      setAvatarUploading(false)
    }
  }

  // 上传用户头像
  const handleUserAvatarUpload: UploadProps['customRequest'] = async (options) => {
    const { file, onSuccess, onError } = options
    setUserAvatarUploading(true)
    try {
      const result = await uploadAIChatImage(file as File, 'avatar')
      setUserAvatarUrl(result.url)
      onSuccess?.(result)
      message.success('用户头像上传成功')
    } catch (err) {
      onError?.(err as Error)
      message.error('上传失败')
    } finally {
      setUserAvatarUploading(false)
    }
  }

  // 上传背景图片
  const handleBackgroundUpload: UploadProps['customRequest'] = async (options) => {
    const { file, onSuccess, onError } = options
    setBackgroundUploading(true)
    try {
      const result = await uploadAIChatImage(file as File, 'background')
      setBackgroundUrl(result.url)
      onSuccess?.(result)
      message.success('背景图片上传成功')
    } catch (err) {
      onError?.(err as Error)
      message.error('上传失败')
    } finally {
      setBackgroundUploading(false)
    }
  }

  const handleCardClick = (character: AICharacter) => {
    navigate(`/ai-chat/${character.id}`)
  }

  const handleSettingsSave = (values: {
    provider: AIProvider
    deepseekApiKey?: string
    claudeApiKey?: string
    claudeBaseUrl?: string
    claudeModel?: string
    qwenApiKey?: string
    qwenBaseUrl?: string
    qwenModel?: string
    gptApiKey?: string
    gptBaseUrl?: string
    gptModel?: string
    geminiApiKey?: string
    geminiBaseUrl?: string
    geminiModel?: string
    deepseekV3ApiKey?: string
    deepseekV3BaseUrl?: string
    deepseekV3Model?: string
  }) => {
    // 保留未更改的字段值，避免条件渲染导致字段被覆盖
    const newDeepseekApiKey = values.deepseekApiKey !== undefined ? values.deepseekApiKey : settings.deepseekApiKey
    const newClaudeApiKey = values.claudeApiKey !== undefined ? values.claudeApiKey : settings.claudeApiKey
    const newClaudeBaseUrl = values.claudeBaseUrl !== undefined ? values.claudeBaseUrl : settings.claudeBaseUrl
    const newClaudeModel = values.claudeModel !== undefined ? values.claudeModel : settings.claudeModel
    const newQwenApiKey = values.qwenApiKey !== undefined ? values.qwenApiKey : settings.qwenApiKey
    const newQwenBaseUrl = values.qwenBaseUrl !== undefined ? values.qwenBaseUrl : settings.qwenBaseUrl
    const newQwenModel = values.qwenModel !== undefined ? values.qwenModel : settings.qwenModel
    const newGptApiKey = values.gptApiKey !== undefined ? values.gptApiKey : settings.gptApiKey
    const newGptBaseUrl = values.gptBaseUrl !== undefined ? values.gptBaseUrl : settings.gptBaseUrl
    const newGptModel = values.gptModel !== undefined ? values.gptModel : settings.gptModel
    const newGeminiApiKey = values.geminiApiKey !== undefined ? values.geminiApiKey : settings.geminiApiKey
    const newGeminiBaseUrl = values.geminiBaseUrl !== undefined ? values.geminiBaseUrl : settings.geminiBaseUrl
    const newGeminiModel = values.geminiModel !== undefined ? values.geminiModel : settings.geminiModel
    const newDeepseekV3ApiKey = values.deepseekV3ApiKey !== undefined ? values.deepseekV3ApiKey : settings.deepseekV3ApiKey
    const newDeepseekV3BaseUrl = values.deepseekV3BaseUrl !== undefined ? values.deepseekV3BaseUrl : settings.deepseekV3BaseUrl
    const newDeepseekV3Model = values.deepseekV3Model !== undefined ? values.deepseekV3Model : settings.deepseekV3Model

    setSettings({
      provider: values.provider,
      deepseekApiKey: newDeepseekApiKey,
      claudeApiKey: newClaudeApiKey,
      claudeBaseUrl: newClaudeBaseUrl,
      claudeModel: newClaudeModel,
      qwenApiKey: newQwenApiKey,
      qwenBaseUrl: newQwenBaseUrl,
      qwenModel: newQwenModel,
      gptApiKey: newGptApiKey,
      gptBaseUrl: newGptBaseUrl,
      gptModel: newGptModel,
      geminiApiKey: newGeminiApiKey,
      geminiBaseUrl: newGeminiBaseUrl,
      geminiModel: newGeminiModel,
      deepseekV3ApiKey: newDeepseekV3ApiKey,
      deepseekV3BaseUrl: newDeepseekV3BaseUrl,
      deepseekV3Model: newDeepseekV3Model,
      // 兼容旧版本
      apiKey: values.provider === 'deepseek' ? newDeepseekApiKey : (values.provider === 'claude' ? newClaudeApiKey : (values.provider === 'qwen' ? newQwenApiKey : (values.provider === 'gpt' ? newGptApiKey : (values.provider === 'gemini' ? newGeminiApiKey : newDeepseekV3ApiKey))))
    })
    message.success('设置已保存')
    setSettingsVisible(false)
  }

  const openSettings = () => {
    settingsForm.setFieldsValue({
      provider: settings.provider || 'deepseek',
      deepseekApiKey: settings.deepseekApiKey || '',
      claudeApiKey: settings.claudeApiKey || '',
      claudeBaseUrl: settings.claudeBaseUrl || 'http://127.0.0.1:8045/v1',
      claudeModel: settings.claudeModel || 'claude-opus-4-5-thinking',
      qwenApiKey: settings.qwenApiKey || '',
      qwenBaseUrl: settings.qwenBaseUrl || 'http://localhost:8317/v1',
      qwenModel: settings.qwenModel || 'qwen3-max',
      gptApiKey: settings.gptApiKey || '',
      gptBaseUrl: settings.gptBaseUrl || 'http://localhost:8317/v1',
      gptModel: settings.gptModel || 'gpt-5.2',
      geminiApiKey: settings.geminiApiKey || '',
      geminiBaseUrl: settings.geminiBaseUrl || 'http://127.0.0.1:8045/v1',
      geminiModel: settings.geminiModel || 'gemini-3-pro-high',
      deepseekV3ApiKey: settings.deepseekV3ApiKey || '',
      deepseekV3BaseUrl: settings.deepseekV3BaseUrl || 'http://localhost:8317/v1',
      deepseekV3Model: settings.deepseekV3Model || 'deepseek-v3.2-chat'
    })
    setSettingsVisible(true)
  }

  if (loading) {
    return (
      <div className={styles.container} style={{ textAlign: 'center', padding: 100 }}>
        <Spin size="large" />
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <Title level={2} className={styles.title}>🤖 AI 聊天</Title>
          <p className={styles.subtitle}>创建和管理你的AI聊天角色</p>
        </div>
        <div className={styles.headerButtons}>
          <Button icon={<SettingOutlined />} onClick={openSettings} className={styles.settingsButton}>
            API设置
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate} className={styles.createButton}>
            创建角色
          </Button>
        </div>
      </div>

      {characters.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>🤖</div>
          <h3 className={styles.emptyTitle}>还没有AI角色</h3>
          <p className={styles.emptyDesc}>创建你的第一个AI聊天角色，开始对话吧！</p>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            创建角色
          </Button>
        </div>
      ) : (
        <div className={styles.characterGrid}>
          {characters.map(character => (
            <div key={character.id} className={styles.characterCard} onClick={() => handleCardClick(character)}>
              <div className={styles.cardCover}>
                {character.backgroundUrl && <img src={getImageUrl(character.backgroundUrl)} alt="" />}
                <div className={styles.avatarWrapper}>
                  <Avatar size={64} src={getImageUrl(character.avatarUrl)} icon={<RobotOutlined />} className={styles.avatar} />
                </div>
              </div>
              <div className={styles.cardContent}>
                <h3 className={styles.characterName}>{character.name}</h3>
                <p className={styles.characterPrompt}>{character.prompt}</p>
                <div className={styles.characterMeta}>
                  <span className={styles.modelTag}>{character.modelName}</span>
                  <span>{character._count?.conversations || 0} 个对话</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 创建/编辑角色弹窗 */}
      <Modal
        title={editingCharacter ? '编辑角色' : '创建新角色'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="name" label="角色名称" rules={[{ required: true, message: '请输入角色名称' }]}>
            <Input placeholder="如：可爱的猫娘" />
          </Form.Item>

          {/* 图片上传区域 */}
          <div className={styles.uploadSection}>
            <div className={styles.uploadItem}>
              <div className={styles.uploadLabel}>角色头像</div>
              <Upload
                accept="image/*"
                showUploadList={false}
                customRequest={handleAvatarUpload}
              >
                <div className={styles.uploadBox}>
                  {avatarUrl ? (
                    <Avatar size={80} src={getImageUrl(avatarUrl)} />
                  ) : (
                    <div className={styles.uploadPlaceholder}>
                      {avatarUploading ? <Spin size="small" /> : <UploadOutlined />}
                      <span>上传头像</span>
                    </div>
                  )}
                </div>
              </Upload>
            </div>

            <div className={styles.uploadItem}>
              <div className={styles.uploadLabel}>用户头像</div>
              <Upload
                accept="image/*"
                showUploadList={false}
                customRequest={handleUserAvatarUpload}
              >
                <div className={styles.uploadBox}>
                  {userAvatarUrl ? (
                    <Avatar size={80} src={getImageUrl(userAvatarUrl)} />
                  ) : (
                    <div className={styles.uploadPlaceholder}>
                      {userAvatarUploading ? <Spin size="small" /> : <UploadOutlined />}
                      <span>上传头像</span>
                    </div>
                  )}
                </div>
              </Upload>
              <div className={styles.uploadHint}>聊天时显示的你的头像</div>
            </div>

            <div className={styles.uploadItem}>
              <div className={styles.uploadLabel}>聊天背景</div>
              <Upload
                accept="image/*"
                showUploadList={false}
                customRequest={handleBackgroundUpload}
              >
                <div className={styles.uploadBoxWide}>
                  {backgroundUrl ? (
                    <img src={getImageUrl(backgroundUrl)} alt="背景" className={styles.backgroundPreview} />
                  ) : (
                    <div className={styles.uploadPlaceholder}>
                      {backgroundUploading ? <Spin size="small" /> : <UploadOutlined />}
                      <span>上传背景图片</span>
                    </div>
                  )}
                </div>
              </Upload>
            </div>
          </div>

          <Form.Item name="prompt" label="角色提示词" rules={[{ required: true, message: '请输入角色提示词' }]}>
            <TextArea rows={4} placeholder="描述角色的性格、说话风格等..." />
          </Form.Item>

          <Form.Item name="bubbleOpacity" label="消息气泡透明度" initialValue={85}>
            <Slider min={0} max={100} marks={{ 0: '透明', 50: '半透明', 100: '不透明' }} />
          </Form.Item>

          <Form.Item name="modelName" label="使用模型" initialValue="deepseek-chat">
            <Select>
              <Select.Option value="deepseek-chat">DeepSeek</Select.Option>
              <Select.Option value="claude-opus-4-5-thinking">Claude</Select.Option>
              <Select.Option value="qwen3-max">Qwen</Select.Option>
              <Select.Option value="gpt-5.2">GPT</Select.Option>
              <Select.Option value="gemini-3-pro-high">Gemini</Select.Option>
              <Select.Option value="deepseek-v3.2-chat">DeepSeek V3</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              {editingCharacter ? '保存修改' : '创建角色'}
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* API设置弹窗 */}
      <Modal
        title="API 设置"
        open={settingsVisible}
        onCancel={() => setSettingsVisible(false)}
        footer={null}
        width={520}
      >
        <Form form={settingsForm} layout="vertical" onFinish={handleSettingsSave}>
          <Form.Item
            name="provider"
            label="选择 AI 服务"
            initialValue="deepseek"
          >
            <Radio.Group>
              <Radio.Button value="deepseek">DeepSeek</Radio.Button>
              <Radio.Button value="claude">Claude</Radio.Button>
              <Radio.Button value="qwen">Qwen</Radio.Button>
              <Radio.Button value="gpt">GPT</Radio.Button>
              <Radio.Button value="gemini">Gemini</Radio.Button>
              <Radio.Button value="deepseekV3">DeepSeek V3</Radio.Button>
            </Radio.Group>
          </Form.Item>

          <Form.Item noStyle shouldUpdate={(prev, cur) => prev.provider !== cur.provider}>
            {({ getFieldValue }) => {
              const provider = getFieldValue('provider')
              if (provider === 'deepseek') {
                return (
                  <Form.Item
                    name="deepseekApiKey"
                    label="DeepSeek API Key"
                    extra="从 platform.deepseek.com 获取 API Key"
                  >
                    <Input.Password placeholder="sk-..." />
                  </Form.Item>
                )
              }
              if (provider === 'claude') {
                return (
                  <>
                    <Form.Item
                      name="claudeBaseUrl"
                      label="Claude API 地址"
                      extra="本地代理服务器地址"
                    >
                      <Input placeholder="http://127.0.0.1:8045/v1" />
                    </Form.Item>
                    <Form.Item
                      name="claudeApiKey"
                      label="Claude API Key"
                    >
                      <Input.Password placeholder="sk-..." />
                    </Form.Item>
                    <Form.Item
                      name="claudeModel"
                      label="Claude 模型"
                    >
                      <Select>
                        <Select.Option value="claude-opus-4-5-thinking">claude-opus-4-5-thinking</Select.Option>
                      </Select>
                    </Form.Item>
                  </>
                )
              }
              // Qwen
              if (provider === 'qwen') {
                return (
                  <>
                    <Form.Item
                      name="qwenBaseUrl"
                      label="Qwen API 地址"
                      extra="本地代理服务器地址"
                    >
                      <Input placeholder="http://localhost:8317/v1" />
                    </Form.Item>
                    <Form.Item
                      name="qwenApiKey"
                      label="Qwen API Key"
                    >
                      <Input.Password placeholder="sk-..." />
                    </Form.Item>
                    <Form.Item
                      name="qwenModel"
                      label="Qwen 模型"
                    >
                      <Select>
                        <Select.Option value="qwen3-max">qwen3-max</Select.Option>
                      </Select>
                    </Form.Item>
                  </>
                )
              }
              // GPT
              if (provider === 'gpt') {
                return (
                  <>
                    <Form.Item
                      name="gptBaseUrl"
                      label="GPT API 地址"
                      extra="本地代理服务器地址"
                    >
                      <Input placeholder="http://localhost:8317/v1" />
                    </Form.Item>
                    <Form.Item
                      name="gptApiKey"
                      label="GPT API Key"
                    >
                      <Input.Password placeholder="sk-..." />
                    </Form.Item>
                    <Form.Item
                      name="gptModel"
                      label="GPT 模型"
                    >
                      <Select>
                        <Select.Option value="gpt-5.2">gpt-5.2</Select.Option>
                      </Select>
                    </Form.Item>
                  </>
                )
              }
              // Gemini
              if (provider === 'gemini') {
                return (
                  <>
                    <Form.Item
                      name="geminiBaseUrl"
                      label="Gemini API 地址"
                      extra="本地代理服务器地址"
                    >
                      <Input placeholder="http://127.0.0.1:8045/v1" />
                    </Form.Item>
                    <Form.Item
                      name="geminiApiKey"
                      label="Gemini API Key"
                    >
                      <Input.Password placeholder="sk-..." />
                    </Form.Item>
                    <Form.Item
                      name="geminiModel"
                      label="Gemini 模型"
                    >
                      <Select>
                        <Select.Option value="gemini-3-pro-high">gemini-3-pro-high</Select.Option>
                      </Select>
                    </Form.Item>
                  </>
                )
              }
              // DeepSeek V3
              return (
                <>
                  <Form.Item
                    name="deepseekV3BaseUrl"
                    label="DeepSeek V3 API 地址"
                    extra="本地代理服务器地址"
                  >
                    <Input placeholder="http://localhost:8317/v1" />
                  </Form.Item>
                  <Form.Item
                    name="deepseekV3ApiKey"
                    label="DeepSeek V3 API Key"
                  >
                    <Input.Password placeholder="sk-..." />
                  </Form.Item>
                  <Form.Item
                    name="deepseekV3Model"
                    label="DeepSeek V3 模型"
                  >
                    <Select>
                      <Select.Option value="deepseek-v3.2-chat">deepseek-v3.2-chat</Select.Option>
                    </Select>
                  </Form.Item>
                </>
              )
            }}
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block>保存设置</Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

