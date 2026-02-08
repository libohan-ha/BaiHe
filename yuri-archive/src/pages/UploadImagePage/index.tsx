import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Form,
  Button,
  Upload,
  Select,
  message,
  Typography,
  Card,
} from 'antd'
import { PlusOutlined, ArrowLeftOutlined } from '@ant-design/icons'
import type { UploadFile } from 'antd'
import { createImage, uploadGalleryImage, getImageTags } from '../../services/api'
import { useUserStore } from '../../store/userStore'
import type { ImageTag } from '../../types'
import styles from './UploadImagePage.module.css'

const { Title } = Typography

interface FormValues {
  tagIds: string[]
}

export function UploadImagePage() {
  const [form] = Form.useForm<FormValues>()
  const navigate = useNavigate()
  const { isLoggedIn } = useUserStore()

  const [submitting, setSubmitting] = useState(false)
  const [tags, setTags] = useState<ImageTag[]>([])
  const [fileList, setFileList] = useState<UploadFile[]>([])

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
      const data = await getImageTags()
      setTags(data)
    } catch {
      // ignore error
    }
  }

  const handleSubmit = async (values: FormValues) => {
    if (fileList.length === 0) {
      message.error('请先选择图片')
      return
    }

    setSubmitting(true)
    const successFiles: string[] = []
    const failedFiles: string[] = []

    for (const fileItem of fileList) {
      const rawFile = fileItem.originFileObj
      const fileName = fileItem.name || '未命名文件'

      if (!(rawFile instanceof File)) {
        failedFiles.push(fileName)
        continue
      }

      try {
        const uploaded = await uploadGalleryImage(rawFile)
        await createImage({
          imageUrl: uploaded.url,
          tagIds: values.tagIds || [],
        })
        successFiles.push(fileName)
      } catch {
        failedFiles.push(fileName)
      }
    }

    if (successFiles.length > 0 && failedFiles.length === 0) {
      message.success(`已成功上传 ${successFiles.length} 张图片`)
    } else if (successFiles.length > 0) {
      const failedPreview = failedFiles.slice(0, 3).join('、')
      message.warning(
        `成功 ${successFiles.length} 张，失败 ${failedFiles.length} 张${
          failedPreview ? `（${failedPreview}${failedFiles.length > 3 ? ' 等' : ''}）` : ''
        }`
      )
    } else {
      message.error('上传失败，请重试')
    }

    if (successFiles.length > 0) {
      setFileList([])
      form.resetFields(['tagIds'])
    }

    setSubmitting(false)
  }

  const handleBack = () => {
    navigate(-1)
  }

  const uploadButton = (
    <div className={styles.uploadButton}>
      <PlusOutlined />
      <div style={{ marginTop: 8 }}>选择图片</div>
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
          上传图片
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
              onChange={({ fileList: newFileList }) => setFileList(newFileList)}
              beforeUpload={() => false}
              multiple
              accept="image/*"
              className={styles.upload}
            >
              {uploadButton}
            </Upload>
            {fileList.length > 0 && (
              <span className={styles.uploadingText}>已选择 {fileList.length} 张图片</span>
            )}
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
              disabled={fileList.length === 0 || submitting}
              className={styles.submitButton}
            >
              {submitting
                ? `发布中（${fileList.length} 张）...`
                : `发布图片${fileList.length > 0 ? `（${fileList.length} 张）` : ''}`}
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
