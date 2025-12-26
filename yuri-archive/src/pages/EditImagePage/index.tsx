import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Form,
  Input,
  Button,
  Upload,
  Select,
  message,
  Typography,
  Card,
  Spin,
} from 'antd'
import { PlusOutlined, ArrowLeftOutlined } from '@ant-design/icons'
import type { UploadFile, UploadProps } from 'antd'
import { getImageById, updateImage, uploadGalleryImage, getImageTags, getImageUrl } from '../../services/api'
import { useUserStore } from '../../store/userStore'
import type { ImageTag, GalleryImage } from '../../types'
import styles from './EditImagePage.module.css'

const { Title } = Typography
const { TextArea } = Input

interface FormValues {
  title: string
  description?: string
  tagIds: string[]
}

export function EditImagePage() {
  const { id } = useParams<{ id: string }>()
  const [form] = Form.useForm<FormValues>()
  const navigate = useNavigate()
  const { currentUser, isLoggedIn } = useUserStore()
  
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [tags, setTags] = useState<ImageTag[]>([])
  const [image, setImage] = useState<GalleryImage | null>(null)
  const [fileList, setFileList] = useState<UploadFile[]>([])
  const [imageUrl, setImageUrl] = useState<string>('')
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    if (!isLoggedIn) {
      message.warning('请先登录')
      navigate('/login')
      return
    }
    if (id) {
      loadData()
    }
  }, [id, isLoggedIn, navigate])

  const loadData = async () => {
    if (!id) return
    setLoading(true)
    try {
      const [imageData, tagsData] = await Promise.all([
        getImageById(id),
        getImageTags(),
      ])
      
      // 检查权限
      const isOwner = currentUser && currentUser.id === imageData.authorId
      const isAdmin = currentUser && (currentUser.role === 'ADMIN' || currentUser.role === 'SUPER_ADMIN')
      if (!isOwner && !isAdmin) {
        message.error('无权限编辑此图片')
        navigate('/gallery')
        return
      }

      setImage(imageData)
      setTags(tagsData)
      setImageUrl(imageData.imageUrl)
      
      // 设置表单初始值
      form.setFieldsValue({
        title: imageData.title,
        description: imageData.description,
        tagIds: imageData.tags.map(t => t.id),
      })

      // 设置文件列表用于预览
      if (imageData.imageUrl) {
        setFileList([
          {
            uid: '-1',
            name: 'image',
            status: 'done',
            url: getImageUrl(imageData.imageUrl),
          },
        ])
      }
    } catch (err) {
      message.error(err instanceof Error ? err.message : '加载数据失败')
      navigate('/gallery')
    } finally {
      setLoading(false)
    }
  }

  const handleUpload: UploadProps['customRequest'] = async (options) => {
    const { file, onSuccess, onError } = options
    
    setUploading(true)
    try {
      const result = await uploadGalleryImage(file as File)
      setImageUrl(result.url)
      onSuccess?.(result)
      message.success('图片上传成功')
    } catch (err) {
      onError?.(err as Error)
      message.error(err instanceof Error ? err.message : '上传失败')
    } finally {
      setUploading(false)
    }
  }

  const handleChange: UploadProps['onChange'] = ({ fileList: newFileList }) => {
    setFileList(newFileList)
  }

  const handleSubmit = async (values: FormValues) => {
    if (!id || !imageUrl) {
      message.error('请先上传图片')
      return
    }

    setSubmitting(true)
    try {
      await updateImage(id, {
        title: values.title,
        description: values.description,
        imageUrl,
        tagIds: values.tagIds || [],
      })
      message.success('更新成功')
      navigate(`/image/${id}`)
    } catch (err) {
      message.error(err instanceof Error ? err.message : '更新失败')
    } finally {
      setSubmitting(false)
    }
  }

  const handleBack = () => {
    navigate(-1)
  }

  const uploadButton = (
    <div className={styles.uploadButton}>
      <PlusOutlined />
      <div style={{ marginTop: 8 }}>更换图片</div>
    </div>
  )

  if (loading) {
    return (
      <div className={styles.loading}>
        <Spin size="large" />
      </div>
    )
  }

  if (!image) {
    return null
  }

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
          ✏️ 编辑图片
        </Title>
      </div>

      <Card className={styles.card}>
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
              mode="multiple"
              placeholder="选择标签（可选）"
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
              loading={submitting}
              className={styles.submitButton}
            >
              保存修改
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