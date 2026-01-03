import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Form,
  Input,
  Button,
  Upload,
  Select,
  message,
  Typography,
  Card,
} from 'antd'
import { PlusOutlined, ArrowLeftOutlined, LockOutlined } from '@ant-design/icons'
import type { UploadFile, UploadProps } from 'antd'
import { createPrivateImage, uploadPrivateImage, getPrivateImageTags } from '../../services/api'
import { useUserStore } from '../../store/userStore'
import type { PrivateImageTag } from '../../types'
import styles from './UploadPrivateImagePage.module.css'

const { Title } = Typography
const { TextArea } = Input

interface FormValues {
  title: string
  description?: string
  tagIds: string[]
}

export function UploadPrivateImagePage() {
  const [form] = Form.useForm<FormValues>()
  const navigate = useNavigate()
  const { isLoggedIn } = useUserStore()
  
  const [loading, setLoading] = useState(false)
  const [tags, setTags] = useState<PrivateImageTag[]>([])
  const [fileList, setFileList] = useState<UploadFile[]>([])
  const [imageUrl, setImageUrl] = useState<string>('')
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    if (!isLoggedIn) {
      message.warning('请先登录')
      navigate('/login')
      return
    }
    loadTags()
  }, [isLoggedIn, navigate])

  const loadTags = async () => {
    try {
      const data = await getPrivateImageTags()
      setTags(data)
    } catch {
      // 忽略错误
    }
  }

  const handleUpload: UploadProps['customRequest'] = async (options) => {
    const { file, onSuccess, onError } = options
    
    setUploading(true)
    try {
      const result = await uploadPrivateImage(file as File)
      setImageUrl(result.url)
      onSuccess?.(result)
      message.success('图片上传成功')
    } catch (err) {
      onError?.(err as Error)
      message.error(err instanceof Error ? err.message : '图片上传失败，请重试')
      // 上传失败时清空文件列表和图片URL
      setFileList([])
      setImageUrl('')
    } finally {
      setUploading(false)
    }
  }

  const handleChange: UploadProps['onChange'] = ({ fileList: newFileList }) => {
    // 如果文件被删除，清空 imageUrl
    if (newFileList.length === 0) {
      setImageUrl('')
    }
    setFileList(newFileList)
  }

  const handleSubmit = async (values: FormValues) => {
    if (!imageUrl) {
      message.error('请先上传图片')
      return
    }

    setLoading(true)
    try {
      const result = await createPrivateImage({
        title: values.title,
        description: values.description,
        imageUrl,
        tagIds: values.tagIds || [],
      })
      message.success('发布成功')
      navigate(`/private-image/${result.id}`)
    } catch (err) {
      message.error(err instanceof Error ? err.message : '发布失败')
    } finally {
      setLoading(false)
    }
  }

  const handleBack = () => {
    navigate(-1)
  }

  const uploadButton = (
    <div className={styles.uploadButton}>
      <PlusOutlined />
      <div style={{ marginTop: 8 }}>上传图片</div>
    </div>
  )

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={handleBack}
          className={styles.backButton}
        >
          返回
        </Button>
        <Title level={2} className={styles.title}>
          <LockOutlined /> 上传隐私图片
        </Title>
      </div>

      <Card className={styles.card}>
        <div className={styles.privateNote}>
          <LockOutlined /> 隐私图片只有您自己可以查看
        </div>
        
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          className={styles.form}
        >
          <Form.Item
            label="图片"
            required
            className={styles.uploadItem}
          >
            <Upload
              listType="picture-card"
              fileList={fileList}
              customRequest={handleUpload}
              onChange={handleChange}
              maxCount={1}
              accept="image/*"
              className={styles.upload}
            >
              {fileList.length >= 1 ? null : uploadButton}
            </Upload>
            {uploading && <span className={styles.uploadingText}>上传中...</span>}
          </Form.Item>

          <Form.Item
            name="title"
            label="标题"
            rules={[
              { required: true, message: '请输入标题' },
              { max: 100, message: '标题最多100个字符' },
            ]}
          >
            <Input placeholder="请输入图片标题" />
          </Form.Item>

          <Form.Item
            name="description"
            label="描述"
            rules={[{ max: 500, message: '描述最多500个字符' }]}
          >
            <TextArea
              placeholder="请输入图片描述（可选）"
              rows={4}
              showCount
              maxLength={500}
            />
          </Form.Item>

          <Form.Item
            name="tagIds"
            label="标签"
          >
            <Select
              mode="tags"
              placeholder="选择或输入标签（可选）"
              options={tags.map((tag) => ({
                label: tag.name,
                value: tag.id,
              }))}
              allowClear
            />
          </Form.Item>

          <Form.Item className={styles.submitItem}>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              disabled={!imageUrl || uploading}
              className={styles.submitButton}
            >
              {uploading ? '图片上传中...' : '发布图片'}
            </Button>
            <Button onClick={handleBack}>
              取消
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}