import { PlusOutlined, RobotOutlined, SettingOutlined, TeamOutlined, UploadOutlined } from '@ant-design/icons'
import type { UploadProps } from 'antd'
import { Avatar, Button, Form, Input, Modal, Select, Slider, Spin, Typography, Upload, message } from 'antd'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createAICharacter, deleteAICharacter, getAICharacters, getImageUrl, listAIModels, updateAICharacter, uploadAIChatImage } from '../../services/api'
import { useAIChatStore, useUserStore } from '../../store'
import type { AIContextStrategy, CustomApiCredential } from '../../store/aiChatStore'
import type { AICharacter, CreateCharacterData } from '../../types'
import { getDefaultModel, getSavedModelOptions, normalizeOpenAIBaseUrl } from '../../utils/aiConfig'
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
  const [modelsLoading, setModelsLoading] = useState(false)
  const [form] = Form.useForm()
  const [settingsForm] = Form.useForm()
  const navigate = useNavigate()
  const { isLoggedIn } = useUserStore()
  const { characters, setCharacters, settings, setSettings } = useAIChatStore()
  const modelOptions = getSavedModelOptions(settings)
  const defaultModel = getDefaultModel(settings)
  const activeCredential = settings.customCredentials.find(item => item.id === settings.activeCustomCredentialId)

  const createCredentialId = () => `custom-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

  const getCredentialName = (baseUrl: string, model: string) => {
    if (model) return model
    if (baseUrl) {
      try {
        return new URL(baseUrl).hostname
      } catch {
        return baseUrl
      }
    }
    return `自定义配置 ${settings.customCredentials.length + 1}`
  }

  const applyCredential = (credential: CustomApiCredential) => {
    settingsForm.setFieldsValue({
      customCredentialId: credential.id,
      customName: credential.name,
      customBaseUrl: credential.baseUrl,
      customApiKey: credential.apiKey,
      customModel: credential.model || credential.models[0],
    })
    setSettings({
      provider: 'custom',
      activeCustomCredentialId: credential.id,
      customBaseUrl: credential.baseUrl,
      customApiKey: credential.apiKey,
      customModel: credential.model || credential.models[0] || '',
      customModels: credential.models,
      defaultModel: credential.model || credential.models[0] || settings.defaultModel,
      apiKey: credential.apiKey,
    })
  }

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
    form.setFieldsValue({ modelName: defaultModel })
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
    customCredentialId?: string
    customName?: string
    customBaseUrl?: string
    customApiKey?: string
    customModel?: string
    contextStrategy?: AIContextStrategy
  }) => {
    const customBaseUrl = normalizeOpenAIBaseUrl(values.customBaseUrl || settings.customBaseUrl)
    const customApiKey = values.customApiKey !== undefined ? values.customApiKey : settings.customApiKey
    const customModel = values.customModel || settings.customModel || settings.customModels[0] || defaultModel
    const credentialId = values.customCredentialId || settings.activeCustomCredentialId || createCredentialId()
    const credentialName = values.customName?.trim() || getCredentialName(customBaseUrl, customModel)
    const existingCredential = settings.customCredentials.find(item => item.id === credentialId)
    const nextCredential: CustomApiCredential = {
      id: credentialId,
      name: credentialName,
      baseUrl: customBaseUrl,
      apiKey: customApiKey,
      model: customModel,
      models: settings.customModels,
      updatedAt: Date.now()
    }
    const customCredentials = existingCredential
      ? settings.customCredentials.map(item => item.id === credentialId ? nextCredential : item)
      : [nextCredential, ...settings.customCredentials]

    setSettings({
      provider: 'custom',
      activeCustomCredentialId: credentialId,
      customCredentials,
      customBaseUrl,
      customApiKey,
      customModel,
      defaultModel: customModel,
      apiKey: customApiKey,
      contextStrategy: values.contextStrategy || settings.contextStrategy,
      contextMessageLimit: 20,
    })
    message.success('设置已保存')
    setSettingsVisible(false)
  }

  const handleLoadModels = async () => {
    const { customCredentialId, customName, customBaseUrl, customApiKey } = settingsForm.getFieldsValue(['customCredentialId', 'customName', 'customBaseUrl', 'customApiKey'])
    const baseUrl = normalizeOpenAIBaseUrl(customBaseUrl || '')
    const apiKey = customApiKey || ''

    if (!baseUrl || !apiKey) {
      message.warning('请先填写自定义端点和 API Key')
      return
    }

    setModelsLoading(true)
    try {
      const models = await listAIModels(baseUrl, apiKey)
      if (models.length === 0) {
        message.warning('端点返回的模型列表为空')
        return
      }
      const selectedModel = models.includes(settings.customModel) ? settings.customModel : models[0]
      const credentialId = customCredentialId || settings.activeCustomCredentialId || createCredentialId()
      const credentialName = customName?.trim() || getCredentialName(baseUrl, selectedModel)
      const nextCredential: CustomApiCredential = {
        id: credentialId,
        name: credentialName,
        baseUrl,
        apiKey,
        model: selectedModel,
        models,
        updatedAt: Date.now()
      }
      const existingCredential = settings.customCredentials.find(item => item.id === credentialId)
      const customCredentials = existingCredential
        ? settings.customCredentials.map(item => item.id === credentialId ? nextCredential : item)
        : [nextCredential, ...settings.customCredentials]
      settingsForm.setFieldsValue({
        customCredentialId: credentialId,
        customName: credentialName,
        customBaseUrl: baseUrl,
        customModel: selectedModel,
      })
      setSettings({
        provider: 'custom',
        activeCustomCredentialId: credentialId,
        customCredentials,
        customBaseUrl: baseUrl,
        customApiKey: apiKey,
        customModel: selectedModel,
        customModels: models,
        defaultModel: selectedModel,
        apiKey,
      })
      message.success(`已获取 ${models.length} 个模型`)
    } catch (err) {
      message.error(err instanceof Error ? err.message : '获取模型列表失败')
    } finally {
      setModelsLoading(false)
    }
  }

  const handleCredentialChange = (credentialId: string) => {
    const credential = settings.customCredentials.find(item => item.id === credentialId)
    if (credential) {
      applyCredential(credential)
    }
  }

  const handleNewCredential = () => {
    const nextName = `自定义配置 ${settings.customCredentials.length + 1}`
    settingsForm.setFieldsValue({
      customCredentialId: '',
      customName: nextName,
      customBaseUrl: '',
      customApiKey: '',
      customModel: undefined,
    })
    setSettings({
      activeCustomCredentialId: '',
      customBaseUrl: '',
      customApiKey: '',
      customModel: '',
      customModels: [],
      apiKey: '',
    })
  }

  const handleDeleteCredential = () => {
    const credentialId = settingsForm.getFieldValue('customCredentialId') || settings.activeCustomCredentialId
    if (!credentialId) {
      message.warning('当前没有可删除的配置')
      return
    }

    const credential = settings.customCredentials.find(item => item.id === credentialId)
    Modal.confirm({
      title: '删除配置',
      content: `确定删除「${credential?.name || '当前配置'}」吗？`,
      onOk: () => {
        const customCredentials = settings.customCredentials.filter(item => item.id !== credentialId)
        const nextCredential = customCredentials[0]
        if (nextCredential) {
          setSettings({
            activeCustomCredentialId: nextCredential.id,
            customCredentials,
            customBaseUrl: nextCredential.baseUrl,
            customApiKey: nextCredential.apiKey,
            customModel: nextCredential.model,
            customModels: nextCredential.models,
            defaultModel: nextCredential.model || settings.defaultModel,
            apiKey: nextCredential.apiKey,
          })
          settingsForm.setFieldsValue({
            customCredentialId: nextCredential.id,
            customName: nextCredential.name,
            customBaseUrl: nextCredential.baseUrl,
            customApiKey: nextCredential.apiKey,
            customModel: nextCredential.model,
          })
        } else {
          setSettings({
            activeCustomCredentialId: '',
            customCredentials: [],
            customBaseUrl: '',
            customApiKey: '',
            customModel: '',
            customModels: [],
            apiKey: '',
          })
          settingsForm.setFieldsValue({
            customCredentialId: '',
            customName: '自定义配置 1',
            customBaseUrl: '',
            customApiKey: '',
            customModel: undefined,
          })
        }
        message.success('配置已删除')
      }
    })
  }

  const openSettings = () => {
    settingsForm.setFieldsValue({
      customCredentialId: activeCredential?.id || settings.activeCustomCredentialId || '',
      customName: activeCredential?.name || getCredentialName(settings.customBaseUrl, settings.customModel),
      customBaseUrl: activeCredential?.baseUrl || settings.customBaseUrl || '',
      customApiKey: activeCredential?.apiKey || settings.customApiKey || '',
      customModel: activeCredential?.model || settings.customModel || defaultModel,
      contextStrategy: settings.contextStrategy || 'summary_recent',
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
          <Button icon={<TeamOutlined />} onClick={() => navigate('/ai-group-chat')} className={styles.groupChatButton}>
            群聊
          </Button>
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

          <Form.Item name="modelName" label="使用模型" initialValue={defaultModel}>
            <Select
              showSearch
              options={modelOptions.map(model => ({ label: model, value: model }))}
              placeholder="请先在 API 设置中获取模型"
            />
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
          <Form.Item label="已保存配置">
            <div style={{ display: 'flex', gap: 8 }}>
              <Form.Item name="customCredentialId" noStyle>
                <Select
                  allowClear
                  placeholder="选择已保存配置"
                  style={{ flex: 1 }}
                  onChange={handleCredentialChange}
                  options={settings.customCredentials.map(item => ({
                    label: `${item.name} · ${item.model || '未选择模型'}`,
                    value: item.id,
                  }))}
                />
              </Form.Item>
              <Button onClick={handleNewCredential}>新建</Button>
              <Button danger onClick={handleDeleteCredential} disabled={settings.customCredentials.length === 0}>
                删除
              </Button>
            </div>
          </Form.Item>

          <Form.Item
            name="customName"
            label="配置名称"
            rules={[{ required: true, message: '请输入配置名称' }]}
          >
            <Input placeholder="例如：GPT 主力 Key / Claude Key" />
          </Form.Item>

          <Form.Item
            name="customBaseUrl"
            label="自定义端点（基础 URL）"
            extra="兼容 OpenAI 格式，例如 https://ai98pro.xyz/v1；发送消息时会自动使用 /chat/completions。"
            rules={[{ required: true, message: '请输入自定义端点' }]}
          >
            <Input placeholder="https://ai98pro.xyz/v1" />
          </Form.Item>

          <Form.Item
            name="customApiKey"
            label="自定义 API Key"
            rules={[{ required: true, message: '请输入 API Key' }]}
          >
            <Input.Password placeholder="sk-..." />
          </Form.Item>

          <Form.Item>
            <Button onClick={handleLoadModels} loading={modelsLoading} block>
              获取可用模型
            </Button>
          </Form.Item>

          <Form.Item
            name="customModel"
            label="可用模型"
            rules={[{ required: true, message: '请选择模型' }]}
          >
            <Select
              showSearch
              loading={modelsLoading}
              options={modelOptions.map(model => ({ label: model, value: model }))}
              placeholder="点击获取可用模型后选择"
            />
          </Form.Item>

          <Form.Item
            name="contextStrategy"
            label="上下文策略"
            initialValue="summary_recent"
            extra="默认只发送最近 20 条文字消息；超过 40 条后自动摘要旧消息。历史图片不会进入上下文。"
          >
            <Select
              options={[
                { label: '最近 20 条 + 自动摘要', value: 'summary_recent' },
                { label: '全部历史', value: 'all' },
              ]}
            />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block>保存设置</Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

