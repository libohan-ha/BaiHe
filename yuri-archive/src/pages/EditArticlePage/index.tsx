import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Form, Input, Button, Card, Typography, Select, Space, Spin, App, Upload } from 'antd'
import { SaveOutlined, SendOutlined, ArrowLeftOutlined, PlusOutlined, LoadingOutlined, DeleteOutlined } from '@ant-design/icons'
import type { UploadProps } from 'antd'
import { getArticleById, updateArticle, getTags, uploadCover, getImageUrl } from '../../services/api'
import { useUserStore } from '../../store'
import type { Tag, Article } from '../../types'
import styles from '../CreateArticlePage/CreateArticlePage.module.css'

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

export function EditArticlePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { message } = App.useApp()
  const { isLoggedIn, currentUser } = useUserStore()
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)
  const [tags, setTags] = useState<Tag[]>([])
  const [tagsLoading] = useState(false)
  const [article, setArticle] = useState<Article | null>(null)
  
  // 封面上传状态
  const [coverUploading, setCoverUploading] = useState(false)
  const [coverPreview, setCoverPreview] = useState<string>('')

  useEffect(() => {
    if (!isLoggedIn) {
      message.warning('请先登录')
      navigate('/login')
      return
    }
    if (id) {
      loadData()
    }
  }, [isLoggedIn, id])

  const loadData = async () => {
    if (!id) return
    setPageLoading(true)
    try {
      const [articleData, tagsData] = await Promise.all([
        getArticleById(id),
        getTags()
      ])
      
      // 检查是否是作者
      const authorId = articleData.authorId || articleData.author?.id
      if (currentUser && authorId !== currentUser.id) {
        message.error('无权编辑此文章')
        navigate('/')
        return
      }
      
      setArticle(articleData)
      setTags(tagsData)
    } catch (err) {
      message.error('加载文章失败')
      navigate('/')
    } finally {
      setPageLoading(false)
    }
  }

  // 当 article 加载完成后填充表单
  useEffect(() => {
    if (article && !pageLoading) {
      form.setFieldsValue({
        title: article.title,
        summary: article.summary,
        content: article.content,
        coverUrl: article.coverUrl,
        tagIds: article.tags?.map(t => t.id) || [],
        status: article.status,
      })
      // 设置封面预览
      setCoverPreview(getImageUrl(article.coverUrl) || '')
    }
  }, [article, pageLoading, form])

  const handleSubmit = async (values: ArticleForm) => {
    if (!id) return
    setLoading(true)
    try {
      await updateArticle(id, {
        title: values.title,
        summary: values.summary,
        content: values.content,
        coverUrl: values.coverUrl || undefined,
        tagIds: values.tagIds || [],
        status: values.status,
      })
      message.success('更新成功')
      navigate(`/article/${id}`)
    } catch (err) {
      message.error(err instanceof Error ? err.message : '更新失败')
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

  if (pageLoading) {
    return (
      <div className={styles.container}>
        <Card className={styles.card}>
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <Spin size="large" />
          </div>
        </Card>
      </div>
    )
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
          <Title level={3} className={styles.title}>✏️ 编辑文章</Title>
        </div>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
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
              placeholder="请输入文章摘要" 
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
    </div>
  )
}
