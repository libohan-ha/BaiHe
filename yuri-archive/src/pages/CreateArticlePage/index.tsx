import { ArrowLeftOutlined, DeleteOutlined, EyeOutlined, LoadingOutlined, PlusOutlined, SaveOutlined, SendOutlined } from '@ant-design/icons'
import type { UploadProps } from 'antd'
import { App, Button, Card, Form, Input, Modal, Select, Space, Typography, Upload } from 'antd'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import previewStyles from '../../components/ImagePreview/ImagePreview.module.css'
import { createArticle, getImageUrl, getTags, uploadCover } from '../../services/api'
import { useUserStore } from '../../store'
import type { Tag } from '../../types'
import styles from './CreateArticlePage.module.css'

const { Title, Text } = Typography
const { TextArea } = Input

interface ArticleForm {
  title: string
  summary: string
  content: string
  coverUrl?: string
  tagIds: string[]
  status: 'DRAFT' | 'PUBLISHED'
}

export function CreateArticlePage() {
  const navigate = useNavigate()
  const { message } = App.useApp()
  const { isLoggedIn } = useUserStore()
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [tags, setTags] = useState<Tag[]>([])
  const [tagsLoading, setTagsLoading] = useState(false)
  
  // 封面上传状态
  const [coverUploading, setCoverUploading] = useState(false)
  const [coverPreview, setCoverPreview] = useState<string>('')
  const [previewVisible, setPreviewVisible] = useState(false)

  useEffect(() => {
    if (!isLoggedIn) {
      message.warning('请先登录')
      navigate('/login')
      return
    }
    loadTags()
  }, [isLoggedIn, navigate])

  const loadTags = async () => {
    setTagsLoading(true)
    try {
      const data = await getTags()
      setTags(data)
    } catch {
      message.error('加载标签失败')
    } finally {
      setTagsLoading(false)
    }
  }

  const handleSubmit = async (values: ArticleForm) => {
    setLoading(true)
    try {
      const article = await createArticle({
        title: values.title,
        summary: values.summary,
        content: values.content,
        coverUrl: values.coverUrl || undefined,
        tagIds: values.tagIds || [],
        status: values.status,
      })
      message.success(values.status === 'PUBLISHED' ? '发布成功' : '保存草稿成功')
      navigate(`/article/${article.id}`)
    } catch (err) {
      message.error(err instanceof Error ? err.message : '提交失败')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveDraft = () => {
    form.setFieldValue('status', 'DRAFT')
    form.submit()
  }

  const handlePublish = () => {
    form.setFieldValue('status', 'PUBLISHED')
    form.submit()
  }

  // 封面上传处理
  const handleCoverUpload: UploadProps['customRequest'] = async (options) => {
    const { file, onSuccess, onError } = options
    
    if (!(file instanceof File)) {
      onError?.(new Error('无效的文件'))
      return
    }

    // 检查文件类型
    const isImage = file.type.startsWith('image/')
    if (!isImage) {
      message.error('只能上传图片文件')
      onError?.(new Error('只能上传图片文件'))
      return
    }

    // 检查文件大小（限制 5MB）
    const isLt5M = file.size / 1024 / 1024 < 5
    if (!isLt5M) {
      message.error('图片大小不能超过 5MB')
      onError?.(new Error('图片大小不能超过 5MB'))
      return
    }

    setCoverUploading(true)
    try {
      const result = await uploadCover(file)
      // 上传成功，设置表单值和预览
      form.setFieldValue('coverUrl', result.url)
      setCoverPreview(getImageUrl(result.url) || '')
      message.success('封面上传成功')
      onSuccess?.(result)
    } catch (err) {
      message.error(err instanceof Error ? err.message : '上传失败')
      onError?.(err instanceof Error ? err : new Error('上传失败'))
    } finally {
      setCoverUploading(false)
    }
  }

  // 删除封面
  const handleRemoveCover = () => {
    form.setFieldValue('coverUrl', '')
    setCoverPreview('')
  }

  // 上传按钮
  const uploadButton = (
    <div>
      {coverUploading ? <LoadingOutlined /> : <PlusOutlined />}
      <div style={{ marginTop: 8 }}>上传封面</div>
    </div>
  )

  if (!isLoggedIn) {
    return null
  }

  return (
    <div className={styles.container}>
      <Card className={styles.card}>
        <div className={styles.header}>
          <Button 
            icon={<ArrowLeftOutlined />} 
            onClick={() => navigate(-1)}
          >
            返回
          </Button>
          <Title level={3} className={styles.title}>✍️ 投稿新文章</Title>
        </div>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{ status: 'PUBLISHED', tagIds: [] }}
        >
          <Form.Item name="status" hidden>
            <Input />
          </Form.Item>

          <Form.Item
            name="title"
            label="文章标题"
            rules={[
              { required: true, message: '请输入文章标题' },
              { max: 100, message: '标题最多100个字符' }
            ]}
          >
            <Input 
              placeholder="请输入文章标题" 
              size="large"
              showCount
              maxLength={100}
            />
          </Form.Item>

          <Form.Item
            name="summary"
            label="文章摘要"
            rules={[
              { max: 300, message: '摘要最多300个字符' }
            ]}
          >
            <TextArea 
              placeholder="请输入文章摘要，将显示在文章列表中" 
              rows={3}
              showCount
              maxLength={300}
            />
          </Form.Item>

          <Form.Item
            name="content"
            label="文章正文"
            rules={[{ required: true, message: '请输入文章正文' }]}
            extra={<Text type="secondary">支持 Markdown 格式</Text>}
          >
            <TextArea 
              placeholder="请输入文章正文，支持 Markdown 格式..."
              rows={15}
              className={styles.contentInput}
            />
          </Form.Item>

          <Form.Item
            name="tagIds"
            label="文章标签"
          >
            <Select
              mode="multiple"
              placeholder="请选择标签"
              loading={tagsLoading}
              options={tags.map(tag => ({
                label: tag.name,
                value: tag.id,
              }))}
              maxTagCount={5}
              optionFilterProp="label"
              showSearch
              getPopupContainer={(trigger) => trigger.parentElement || document.body}
            />
          </Form.Item>

          <Form.Item
            name="coverUrl"
            label="封面图片"
          >
            <div className={styles.coverUpload}>
              <Upload
                name="cover"
                listType="picture-card"
                showUploadList={false}
                customRequest={handleCoverUpload}
                accept="image/*"
                className={styles.coverUploader}
              >
                {coverPreview ? (
                  <div className={styles.coverPreviewWrapper}>
                    <img
                      src={coverPreview}
                      alt="封面预览"
                      className={styles.coverPreview}
                    />
                    <div className={styles.coverActions}>
                      <Button
                        type="text"
                        icon={<EyeOutlined />}
                        onClick={(e) => { e.stopPropagation(); setPreviewVisible(true); }}
                        className={styles.actionBtn}
                      >
                        预览
                      </Button>
                      <Button
                        type="text"
                        icon={<DeleteOutlined />}
                        onClick={(e) => { e.stopPropagation(); handleRemoveCover(); }}
                        className={styles.removeBtn}
                      >
                        删除
                      </Button>
                    </div>
                  </div>
                ) : (
                  uploadButton
                )}
              </Upload>
              <div className={styles.coverHint}>
                <Text type="secondary">
                  支持 JPG、PNG 格式，建议尺寸 1200x630，大小不超过 5MB
                </Text>
              </div>
            </div>
          </Form.Item>

          <Form.Item className={styles.actions}>
            <Space size="middle">
              <Button
                icon={<SaveOutlined />}
                onClick={handleSaveDraft}
                loading={loading}
              >
                保存草稿
              </Button>
              <Button
                type="primary"
                icon={<SendOutlined />}
                onClick={handlePublish}
                loading={loading}
              >
                发布文章
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      {/* 封面图片预览弹窗 */}
      <Modal
        open={previewVisible}
        footer={null}
        onCancel={() => setPreviewVisible(false)}
        width="90%"
        style={{ maxWidth: 1200 }}
        centered
        className={previewStyles.previewModal}
        destroyOnClose
      >
        <img
          src={coverPreview}
          alt="封面预览"
          className={previewStyles.fullImage}
        />
      </Modal>
    </div>
  )
}
