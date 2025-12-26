import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Typography, Avatar, Tabs, message, Row, Col, Card, Button, Modal, Form, Input, Upload } from 'antd'
import { UserOutlined, EditOutlined, HeartOutlined, LoginOutlined, SettingOutlined, LoadingOutlined, PlusOutlined } from '@ant-design/icons'
import type { UploadProps } from 'antd'
import { ArticleList, GalleryList } from '../../components'
import { getUserArticles, getCollections, getImageCollections, updateProfile, uploadAvatar, getImageUrl } from '../../services/api'
import { useUserStore } from '../../store'
import type { Article, GalleryImage } from '../../types'
import styles from './UserCenterPage.module.css'

const { Title, Text } = Typography
const { TextArea } = Input
const PAGE_SIZE = 10

interface ProfileForm {
  username: string
  bio: string
  avatarUrl: string
}

export function UserCenterPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = searchParams.get('tab') || 'articles'
  
  const { currentUser, isLoggedIn, setUser } = useUserStore()
  
  const [articles, setArticles] = useState<Article[]>([])
  const [collectedArticles, setCollectedArticles] = useState<Article[]>([])
  const [collectedImages, setCollectedImages] = useState<GalleryImage[]>([])
  const [articlesLoading, setArticlesLoading] = useState(false)
  const [collectionsLoading, setCollectionsLoading] = useState(false)
  const [imageCollectionsLoading, setImageCollectionsLoading] = useState(false)
  const [articlesPage, setArticlesPage] = useState(1)
  const [collectionsPage, setCollectionsPage] = useState(1)
  const [imageCollectionsPage, setImageCollectionsPage] = useState(1)
  const [articlesTotal, setArticlesTotal] = useState(0)
  const [collectionsTotal, setCollectionsTotal] = useState(0)
  const [imageCollectionsTotal, setImageCollectionsTotal] = useState(0)
  
  // 编辑资料弹窗
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editLoading, setEditLoading] = useState(false)
  const [form] = Form.useForm()
  
  // 头像上传状态
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState<string>('')

  useEffect(() => {
    if (currentUser && isLoggedIn) {
      loadArticles()
    }
  }, [currentUser, isLoggedIn, articlesPage])

  useEffect(() => {
    if (isLoggedIn) {
      loadCollections()
    }
  }, [isLoggedIn, collectionsPage])

  useEffect(() => {
    if (isLoggedIn) {
      loadImageCollections()
    }
  }, [isLoggedIn, imageCollectionsPage])

  const loadArticles = async () => {
    if (!currentUser) return
    setArticlesLoading(true)
    try {
      const res = await getUserArticles(currentUser.id, articlesPage, PAGE_SIZE)
      setArticles(res.data)
      setArticlesTotal(res.total)
    } catch (err) {
      message.error(err instanceof Error ? err.message : '加载投稿失败')
    } finally {
      setArticlesLoading(false)
    }
  }

  const loadCollections = async () => {
    setCollectionsLoading(true)
    try {
      const res = await getCollections(collectionsPage, PAGE_SIZE)
      setCollectedArticles(res.data)
      setCollectionsTotal(res.total)
    } catch (err) {
      message.error(err instanceof Error ? err.message : '加载收藏失败')
    } finally {
      setCollectionsLoading(false)
    }
  }

  const loadImageCollections = async () => {
    setImageCollectionsLoading(true)
    try {
      const res = await getImageCollections(imageCollectionsPage, PAGE_SIZE)
      setCollectedImages(res.data)
      setImageCollectionsTotal(res.total)
    } catch (err) {
      message.error(err instanceof Error ? err.message : '加载图片收藏失败')
    } finally {
      setImageCollectionsLoading(false)
    }
  }

  const handleTabChange = (key: string) => {
    setSearchParams({ tab: key })
  }

  const openEditModal = () => {
    form.setFieldsValue({
      username: currentUser?.username || '',
      bio: currentUser?.bio || '',
      avatarUrl: currentUser?.avatarUrl || '',
    })
    setAvatarPreview(getImageUrl(currentUser?.avatarUrl) || '')
    setEditModalOpen(true)
  }

  // 头像上传处理
  const handleAvatarUpload: UploadProps['customRequest'] = async (options) => {
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

    // 检查文件大小（限制 2MB）
    const isLt2M = file.size / 1024 / 1024 < 2
    if (!isLt2M) {
      message.error('图片大小不能超过 2MB')
      onError?.(new Error('图片大小不能超过 2MB'))
      return
    }

    setAvatarUploading(true)
    try {
      const result = await uploadAvatar(file)
      // 上传成功，设置表单值和预览
      form.setFieldValue('avatarUrl', result.url)
      setAvatarPreview(getImageUrl(result.url) || '')
      message.success('头像上传成功')
      onSuccess?.(result)
    } catch (err) {
      message.error(err instanceof Error ? err.message : '上传失败')
      onError?.(err instanceof Error ? err : new Error('上传失败'))
    } finally {
      setAvatarUploading(false)
    }
  }

  // 上传按钮
  const uploadButton = (
    <div>
      {avatarUploading ? <LoadingOutlined /> : <PlusOutlined />}
      <div style={{ marginTop: 8 }}>上传头像</div>
    </div>
  )

  const handleEditProfile = async (values: ProfileForm) => {
    setEditLoading(true)
    try {
      const updatedUser = await updateProfile({
        username: values.username,
        bio: values.bio || undefined,
        avatarUrl: values.avatarUrl || undefined,
      })
      // 更新本地用户状态
      setUser(updatedUser)
      message.success('资料更新成功')
      setEditModalOpen(false)
    } catch (err) {
      message.error(err instanceof Error ? err.message : '更新失败')
    } finally {
      setEditLoading(false)
    }
  }

  if (!isLoggedIn || !currentUser) {
    return (
      <div className={styles.notLoggedIn}>
        <Card className={styles.loginCard}>
          <div className={styles.loginContent}>
            <Avatar size={64} icon={<UserOutlined />} />
            <Title level={4}>请先登录</Title>
            <Text type="secondary">登录后可查看个人中心</Text>
            <Button type="primary" icon={<LoginOutlined />} href="/login">
              去登录
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  const tabItems = [
    {
      key: 'articles',
      label: (
        <span>
          <EditOutlined /> 我的投稿 ({articlesTotal})
        </span>
      ),
      children: (
        <ArticleList
          articles={articles}
          loading={articlesLoading && activeTab === 'articles'}
          pagination={{
            current: articlesPage,
            total: articlesTotal,
            pageSize: PAGE_SIZE,
            onChange: setArticlesPage,
          }}
        />
      ),
    },
    {
      key: 'collections',
      label: (
        <span>
          <HeartOutlined /> 文章收藏 ({collectionsTotal})
        </span>
      ),
      children: (
        <ArticleList
          articles={collectedArticles}
          loading={collectionsLoading && activeTab === 'collections'}
          pagination={{
            current: collectionsPage,
            total: collectionsTotal,
            pageSize: PAGE_SIZE,
            onChange: setCollectionsPage,
          }}
        />
      ),
    },
    {
      key: 'image-collections',
      label: (
        <span>
          <HeartOutlined /> 图片收藏 ({imageCollectionsTotal})
        </span>
      ),
      children: (
        <GalleryList
          images={collectedImages}
          loading={imageCollectionsLoading && activeTab === 'image-collections'}
          pagination={{
            current: imageCollectionsPage,
            total: imageCollectionsTotal,
            pageSize: PAGE_SIZE,
            onChange: setImageCollectionsPage,
          }}
        />
      ),
    },
  ]

  return (
    <div className={styles.container}>
      <Row gutter={24}>
        <Col xs={24} md={8} lg={6}>
          <Card className={styles.profileCard}>
            <div className={styles.profile}>
              <Avatar
                size={80}
                src={getImageUrl(currentUser.avatarUrl)}
                icon={<UserOutlined />}
                className={styles.avatar}
              />
              <Title level={4} className={styles.username}>
                {currentUser.username}
              </Title>
              <Text className={styles.bio}>
                {currentUser.bio || '这个人很懒，什么都没写~'}
              </Text>
              <Button 
                icon={<SettingOutlined />} 
                onClick={openEditModal}
                className={styles.editBtn}
              >
                编辑资料
              </Button>
              <div className={styles.stats}>
                <div className={styles.statItem}>
                  <span className={styles.statValue}>{articlesTotal}</span>
                  <span className={styles.statLabel}>投稿</span>
                </div>
                <div className={styles.statItem}>
                  <span className={styles.statValue}>{collectionsTotal + imageCollectionsTotal}</span>
                  <span className={styles.statLabel}>收藏</span>
                </div>
              </div>
            </div>
          </Card>
        </Col>
        
        <Col xs={24} md={16} lg={18}>
          <Card className={styles.contentCard}>
            <Tabs
              activeKey={activeTab}
              onChange={handleTabChange}
              items={tabItems}
            />
          </Card>
        </Col>
      </Row>

      <Modal
        title="编辑个人资料"
        open={editModalOpen}
        onCancel={() => setEditModalOpen(false)}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleEditProfile}
        >
          <Form.Item
            name="username"
            label="用户名"
            rules={[
              { required: true, message: '请输入用户名' },
              { max: 20, message: '用户名最多20个字符' }
            ]}
          >
            <Input placeholder="请输入用户名" maxLength={20} />
          </Form.Item>

          <Form.Item
            name="bio"
            label="个人简介"
            rules={[{ max: 200, message: '简介最多200个字符' }]}
          >
            <TextArea 
              placeholder="介绍一下自己吧~" 
              rows={3}
              maxLength={200}
              showCount
            />
          </Form.Item>

          <Form.Item
            name="avatarUrl"
            label="头像"
          >
            <div className={styles.avatarUpload}>
              <Upload
                name="avatar"
                listType="picture-card"
                showUploadList={false}
                customRequest={handleAvatarUpload}
                accept="image/*"
              >
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="头像预览"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8 }}
                  />
                ) : (
                  uploadButton
                )}
              </Upload>
              <Text type="secondary" className={styles.uploadHint}>
                支持 JPG、PNG 格式，大小不超过 2MB
              </Text>
            </div>
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Button onClick={() => setEditModalOpen(false)} style={{ marginRight: 8 }}>
              取消
            </Button>
            <Button type="primary" htmlType="submit" loading={editLoading}>
              保存
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
