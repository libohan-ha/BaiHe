import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  Typography, Card, Tabs, Table, Button, Space, message,
  Popconfirm, Avatar, Select, Input, Modal, Form
} from 'antd'
import {
  UserOutlined, FileTextOutlined, DeleteOutlined,
  CrownOutlined, StopOutlined, CheckCircleOutlined, TagOutlined, EditOutlined, PlusOutlined, SafetyCertificateOutlined, PictureOutlined
} from '@ant-design/icons'
import dayjs from 'dayjs'
import {
  getAdminUsers, getAdminArticles, updateUserRole,
  deleteUser, updateArticleStatus, deleteArticleAdmin,
  getTags, updateTag, deleteTag, createTag,
  getSuperAdmins, createAdmin, updateAdmin, deleteAdmin,
  getImageUrl,
  getImageTags, createImageTag, updateImageTag, deleteImageTag
} from '../../services/api'
import { useUserStore } from '../../store'
import type { User, Article, Tag, ImageTag } from '../../types'
import styles from './AdminPage.module.css'

const { Title } = Typography

export function AdminPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = searchParams.get('tab') || 'users'
  
  const { currentUser, isLoggedIn } = useUserStore()
  
  // 用户管理状态
  const [users, setUsers] = useState<User[]>([])
  const [usersLoading, setUsersLoading] = useState(false)
  const [usersPage, setUsersPage] = useState(1)
  const [usersTotal, setUsersTotal] = useState(0)
  
  // 文章管理状态
  const [articles, setArticles] = useState<Article[]>([])
  const [articlesLoading, setArticlesLoading] = useState(false)
  const [articlesPage, setArticlesPage] = useState(1)
  const [articlesTotal, setArticlesTotal] = useState(0)

  // 文章标签管理状态
  const [tags, setTags] = useState<Tag[]>([])
  const [tagsLoading, setTagsLoading] = useState(false)
  const [editTagModal, setEditTagModal] = useState(false)
  const [editingTag, setEditingTag] = useState<Tag | null>(null)
  const [editTagLoading, setEditTagLoading] = useState(false)
  const [tagForm] = Form.useForm()
  const [createTagModal, setCreateTagModal] = useState(false)
  const [createTagLoading, setCreateTagLoading] = useState(false)
  const [createTagForm] = Form.useForm()

  // 图片标签管理状态
  const [imageTags, setImageTags] = useState<ImageTag[]>([])
  const [imageTagsLoading, setImageTagsLoading] = useState(false)
  const [editImageTagModal, setEditImageTagModal] = useState(false)
  const [editingImageTag, setEditingImageTag] = useState<ImageTag | null>(null)
  const [editImageTagLoading, setEditImageTagLoading] = useState(false)
  const [imageTagForm] = Form.useForm()
  const [createImageTagModal, setCreateImageTagModal] = useState(false)
  const [createImageTagLoading, setCreateImageTagLoading] = useState(false)
  const [createImageTagForm] = Form.useForm()

  // 管理员管理状态（仅超级管理员可见）
  const [admins, setAdmins] = useState<User[]>([])
  const [adminsLoading, setAdminsLoading] = useState(false)
  const [adminsPage, setAdminsPage] = useState(1)
  const [adminsTotal, setAdminsTotal] = useState(0)
  const [createAdminModal, setCreateAdminModal] = useState(false)
  const [createAdminLoading, setCreateAdminLoading] = useState(false)
  const [createAdminForm] = Form.useForm()
  const [editAdminModal, setEditAdminModal] = useState(false)
  const [editingAdmin, setEditingAdmin] = useState<User | null>(null)
  const [editAdminLoading, setEditAdminLoading] = useState(false)
  const [editAdminForm] = Form.useForm()

  // 检查管理员权限
  useEffect(() => {
    if (!isLoggedIn) {
      message.warning('请先登录')
      navigate('/login')
      return
    }
    if (currentUser?.role !== 'ADMIN' && currentUser?.role !== 'SUPER_ADMIN') {
      message.error('无权访问管理后台')
      navigate('/')
      return
    }
  }, [isLoggedIn, currentUser, navigate])

  useEffect(() => {
    if (currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPER_ADMIN') {
      if (activeTab === 'users') {
        loadUsers()
      } else if (activeTab === 'articles') {
        loadArticles()
      } else if (activeTab === 'tags') {
        loadTags()
      } else if (activeTab === 'imageTags') {
        loadImageTags()
      } else if (activeTab === 'admins' && currentUser?.role === 'SUPER_ADMIN') {
        loadAdmins()
      }
    }
  }, [activeTab, usersPage, articlesPage, adminsPage, currentUser])

  const loadUsers = async () => {
    setUsersLoading(true)
    try {
      const res = await getAdminUsers(usersPage, 10)
      setUsers(res.data)
      setUsersTotal(res.total)
    } catch (err) {
      message.error(err instanceof Error ? err.message : '加载用户失败')
    } finally {
      setUsersLoading(false)
    }
  }

  const loadArticles = async () => {
    setArticlesLoading(true)
    try {
      const res = await getAdminArticles(articlesPage, 10)
      setArticles(res.data)
      setArticlesTotal(res.total)
    } catch (err) {
      message.error(err instanceof Error ? err.message : '加载文章失败')
    } finally {
      setArticlesLoading(false)
    }
  }

  const loadTags = async () => {
    setTagsLoading(true)
    try {
      const data = await getTags()
      setTags(data)
    } catch (err) {
      message.error(err instanceof Error ? err.message : '加载标签失败')
    } finally {
      setTagsLoading(false)
    }
  }

  const handleRoleChange = async (userId: string, role: 'USER' | 'ADMIN') => {
    try {
      await updateUserRole(userId, role)
      message.success('角色更新成功')
      loadUsers()
    } catch (err) {
      message.error(err instanceof Error ? err.message : '更新失败')
    }
  }

  const handleDeleteUser = async (userId: string) => {
    try {
      await deleteUser(userId)
      message.success('删除成功')
      loadUsers()
    } catch (err) {
      message.error(err instanceof Error ? err.message : '删除失败')
    }
  }

  const handleStatusChange = async (articleId: string, status: 'DRAFT' | 'PUBLISHED') => {
    try {
      await updateArticleStatus(articleId, status)
      message.success('状态更新成功')
      loadArticles()
    } catch (err) {
      message.error(err instanceof Error ? err.message : '更新失败')
    }
  }

  const handleDeleteArticle = async (articleId: string) => {
    try {
      await deleteArticleAdmin(articleId)
      message.success('删除成功')
      loadArticles()
    } catch (err) {
      message.error(err instanceof Error ? err.message : '删除失败')
    }
  }

  const openEditTagModal = (tag: Tag) => {
    setEditingTag(tag)
    tagForm.setFieldsValue({ name: tag.name })
    setEditTagModal(true)
  }

  const handleEditTag = async (values: { name: string }) => {
    if (!editingTag) return
    setEditTagLoading(true)
    try {
      await updateTag(editingTag.id, values.name)
      message.success('标签更新成功')
      setEditTagModal(false)
      loadTags()
    } catch (err) {
      message.error(err instanceof Error ? err.message : '更新失败')
    } finally {
      setEditTagLoading(false)
    }
  }

  const handleDeleteTag = async (tagId: string) => {
    try {
      await deleteTag(tagId)
      message.success('标签删除成功')
      loadTags()
    } catch (err) {
      message.error(err instanceof Error ? err.message : '删除失败')
    }
  }

  const handleCreateTag = async (values: { name: string }) => {
    setCreateTagLoading(true)
    try {
      await createTag(values.name)
      message.success('标签创建成功')
      setCreateTagModal(false)
      createTagForm.resetFields()
      loadTags()
    } catch (err) {
      message.error(err instanceof Error ? err.message : '创建失败')
    } finally {
      setCreateTagLoading(false)
    }
  }

  // 图片标签管理相关函数
  const loadImageTags = async () => {
    setImageTagsLoading(true)
    try {
      const data = await getImageTags()
      setImageTags(data)
    } catch (err) {
      message.error(err instanceof Error ? err.message : '加载图片标签失败')
    } finally {
      setImageTagsLoading(false)
    }
  }

  const openEditImageTagModal = (tag: ImageTag) => {
    setEditingImageTag(tag)
    imageTagForm.setFieldsValue({ name: tag.name })
    setEditImageTagModal(true)
  }

  const handleEditImageTag = async (values: { name: string }) => {
    if (!editingImageTag) return
    setEditImageTagLoading(true)
    try {
      await updateImageTag(editingImageTag.id, values.name)
      message.success('图片标签更新成功')
      setEditImageTagModal(false)
      loadImageTags()
    } catch (err) {
      message.error(err instanceof Error ? err.message : '更新失败')
    } finally {
      setEditImageTagLoading(false)
    }
  }

  const handleDeleteImageTag = async (tagId: string) => {
    try {
      await deleteImageTag(tagId)
      message.success('图片标签删除成功')
      loadImageTags()
    } catch (err) {
      message.error(err instanceof Error ? err.message : '删除失败')
    }
  }

  const handleCreateImageTag = async (values: { name: string }) => {
    setCreateImageTagLoading(true)
    try {
      await createImageTag(values.name)
      message.success('图片标签创建成功')
      setCreateImageTagModal(false)
      createImageTagForm.resetFields()
      loadImageTags()
    } catch (err) {
      message.error(err instanceof Error ? err.message : '创建失败')
    } finally {
      setCreateImageTagLoading(false)
    }
  }

  // 管理员管理相关函数
  const loadAdmins = async () => {
    setAdminsLoading(true)
    try {
      const res = await getSuperAdmins(adminsPage, 10)
      setAdmins(res.data)
      setAdminsTotal(res.total)
    } catch (err) {
      message.error(err instanceof Error ? err.message : '加载管理员失败')
    } finally {
      setAdminsLoading(false)
    }
  }

  const handleCreateAdmin = async (values: { email: string; username: string; password: string; role: 'ADMIN' | 'SUPER_ADMIN' }) => {
    setCreateAdminLoading(true)
    try {
      await createAdmin(values)
      message.success('管理员创建成功')
      setCreateAdminModal(false)
      createAdminForm.resetFields()
      loadAdmins()
    } catch (err) {
      message.error(err instanceof Error ? err.message : '创建失败')
    } finally {
      setCreateAdminLoading(false)
    }
  }

  const openEditAdminModal = (admin: User) => {
    setEditingAdmin(admin)
    editAdminForm.setFieldsValue({
      email: admin.email,
      username: admin.username,
      role: admin.role,
    })
    setEditAdminModal(true)
  }

  const handleEditAdmin = async (values: { email?: string; username?: string; password?: string; role?: 'ADMIN' | 'SUPER_ADMIN' }) => {
    if (!editingAdmin) return
    setEditAdminLoading(true)
    try {
      const data: { email?: string; username?: string; password?: string; role?: 'ADMIN' | 'SUPER_ADMIN' } = {}
      if (values.email) data.email = values.email
      if (values.username) data.username = values.username
      if (values.password) data.password = values.password
      if (values.role) data.role = values.role
      await updateAdmin(editingAdmin.id, data)
      message.success('管理员更新成功')
      setEditAdminModal(false)
      loadAdmins()
    } catch (err) {
      message.error(err instanceof Error ? err.message : '更新失败')
    } finally {
      setEditAdminLoading(false)
    }
  }

  const handleDeleteAdmin = async (adminId: string) => {
    try {
      await deleteAdmin(adminId)
      message.success('管理员删除成功')
      loadAdmins()
    } catch (err) {
      message.error(err instanceof Error ? err.message : '删除失败')
    }
  }

  if (!isLoggedIn || (currentUser?.role !== 'ADMIN' && currentUser?.role !== 'SUPER_ADMIN')) {
    return null
  }

  const userColumns = [
    {
      title: '用户',
      dataIndex: 'username',
      key: 'username',
      render: (_: string, record: User) => (
        <Space>
          <Avatar src={getImageUrl(record.avatarUrl)} icon={<UserOutlined />} size="small" />
          <span>{record.username}</span>
        </Space>
      ),
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      render: (role: string, record: User) => {
        // 如果是超级管理员，显示为只读文本
        if (role === 'SUPER_ADMIN') {
          return (
            <span>
              <SafetyCertificateOutlined style={{ color: '#f5222d' }} /> 超级管理员
            </span>
          )
        }
        
        // 普通管理员不能修改超级管理员的角色（虽然超级管理员已经在上面处理了）
        // 这里检查当前用户是否有权限修改
        const canModify = currentUser?.role === 'SUPER_ADMIN' || record.role !== 'SUPER_ADMIN'
        
        return (
          <Select
            value={role as 'USER' | 'ADMIN'}
            onChange={(value: 'USER' | 'ADMIN') => handleRoleChange(record.id, value)}
            style={{ width: 100 }}
            disabled={record.id === currentUser?.id || !canModify}
          >
            <Select.Option value="USER">
              <UserOutlined /> 用户
            </Select.Option>
            <Select.Option value="ADMIN">
              <CrownOutlined /> 管理员
            </Select.Option>
          </Select>
        )
      },
    },
    {
      title: '注册时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => dayjs(date).format('YYYY-MM-DD'),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: User) => {
        // 不能删除自己，普通管理员也不能删除超级管理员
        const canDelete = record.id !== currentUser?.id &&
          (currentUser?.role === 'SUPER_ADMIN' || record.role !== 'SUPER_ADMIN')
        
        return (
          <Popconfirm
            title="确定删除此用户吗？"
            description="删除后无法恢复"
            onConfirm={() => handleDeleteUser(record.id)}
            disabled={!canDelete}
          >
            <Button
              danger
              icon={<DeleteOutlined />}
              size="small"
              disabled={!canDelete}
            >
              删除
            </Button>
          </Popconfirm>
        )
      },
    },
  ]

  const articleColumns = [
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      render: (title: string, record: Article) => (
        <a onClick={() => navigate(`/article/${record.id}`)}>{title}</a>
      ),
    },
    {
      title: '作者',
      dataIndex: 'author',
      key: 'author',
      render: (author: any) => author?.username || '未知',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string, record: Article) => (
        <Select
          value={status as 'DRAFT' | 'PUBLISHED'}
          onChange={(value: 'DRAFT' | 'PUBLISHED') => handleStatusChange(record.id, value)}
          style={{ width: 100 }}
        >
          <Select.Option value="PUBLISHED">
            <CheckCircleOutlined style={{ color: '#52c41a' }} /> 已发布
          </Select.Option>
          <Select.Option value="DRAFT">
            <StopOutlined style={{ color: '#faad14' }} /> 草稿
          </Select.Option>
        </Select>
      ),
    },
    {
      title: '浏览量',
      dataIndex: 'views',
      key: 'views',
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => dayjs(date).format('YYYY-MM-DD'),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Article) => (
        <Popconfirm
          title="确定删除此文章吗？"
          description="删除后无法恢复"
          onConfirm={() => handleDeleteArticle(record.id)}
        >
          <Button danger icon={<DeleteOutlined />} size="small">
            删除
          </Button>
        </Popconfirm>
      ),
    },
  ]

  const tagColumns = [
    {
      title: '标签名称',
      dataIndex: 'name',
      key: 'name',
      render: (name: string) => (
        <Space>
          <TagOutlined style={{ color: '#7c3aed' }} />
          <span>{name}</span>
        </Space>
      ),
    },
    {
      title: '文章数量',
      dataIndex: 'articleCount',
      key: 'articleCount',
      render: (count: number) => count || 0,
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Tag) => (
        <Space>
          <Button
            icon={<EditOutlined />}
            size="small"
            onClick={() => openEditTagModal(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定删除此标签吗？"
            description="删除后无法恢复"
            onConfirm={() => handleDeleteTag(record.id)}
          >
            <Button danger icon={<DeleteOutlined />} size="small">
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  const imageTagColumns = [
    {
      title: '标签名称',
      dataIndex: 'name',
      key: 'name',
      render: (name: string) => (
        <Space>
          <PictureOutlined style={{ color: '#ec4899' }} />
          <span>{name}</span>
        </Space>
      ),
    },
    {
      title: '图片数量',
      dataIndex: 'imageCount',
      key: 'imageCount',
      render: (count: number) => count || 0,
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: ImageTag) => (
        <Space>
          <Button
            icon={<EditOutlined />}
            size="small"
            onClick={() => openEditImageTagModal(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定删除此图片标签吗？"
            description="删除后无法恢复"
            onConfirm={() => handleDeleteImageTag(record.id)}
          >
            <Button danger icon={<DeleteOutlined />} size="small">
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  const adminColumns = [
    {
      title: '管理员',
      dataIndex: 'username',
      key: 'username',
      render: (_: string, record: User) => (
        <Space>
          <Avatar src={getImageUrl(record.avatarUrl)} icon={<UserOutlined />} size="small" />
          <span>{record.username}</span>
        </Space>
      ),
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => (
        <span>
          {role === 'SUPER_ADMIN' ? (
            <><SafetyCertificateOutlined style={{ color: '#f5222d' }} /> 超级管理员</>
          ) : (
            <><CrownOutlined style={{ color: '#faad14' }} /> 管理员</>
          )}
        </span>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => dayjs(date).format('YYYY-MM-DD'),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: User) => (
        <Space>
          <Button 
            icon={<EditOutlined />} 
            size="small"
            onClick={() => openEditAdminModal(record)}
            disabled={record.id === currentUser?.id}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定删除此管理员吗？"
            description="删除后无法恢复"
            onConfirm={() => handleDeleteAdmin(record.id)}
            disabled={record.id === currentUser?.id}
          >
            <Button 
              danger 
              icon={<DeleteOutlined />} 
              size="small"
              disabled={record.id === currentUser?.id}
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  const tabItems = [
    {
      key: 'users',
      label: <span><UserOutlined /> 用户管理</span>,
      children: (
        <Table
          columns={userColumns}
          dataSource={users}
          rowKey="id"
          loading={usersLoading}
          pagination={{
            current: usersPage,
            total: usersTotal,
            pageSize: 10,
            onChange: setUsersPage,
          }}
        />
      ),
    },
    {
      key: 'articles',
      label: <span><FileTextOutlined /> 文章管理</span>,
      children: (
        <Table
          columns={articleColumns}
          dataSource={articles}
          rowKey="id"
          loading={articlesLoading}
          pagination={{
            current: articlesPage,
            total: articlesTotal,
            pageSize: 10,
            onChange: setArticlesPage,
          }}
        />
      ),
    },
    {
      key: 'tags',
      label: <span><TagOutlined /> 文章标签</span>,
      children: (
        <>
          <div style={{ marginBottom: 16 }}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setCreateTagModal(true)}
            >
              新增文章标签
            </Button>
          </div>
          <Table
            columns={tagColumns}
            dataSource={tags}
            rowKey="id"
            loading={tagsLoading}
            pagination={false}
          />
        </>
      ),
    },
    {
      key: 'imageTags',
      label: <span><PictureOutlined /> 图片标签</span>,
      children: (
        <>
          <div style={{ marginBottom: 16 }}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setCreateImageTagModal(true)}
            >
              新增图片标签
            </Button>
          </div>
          <Table
            columns={imageTagColumns}
            dataSource={imageTags}
            rowKey="id"
            loading={imageTagsLoading}
            pagination={false}
          />
        </>
      ),
    },
    // 超级管理员专属 Tab
    ...(currentUser?.role === 'SUPER_ADMIN' ? [{
      key: 'admins',
      label: <span><SafetyCertificateOutlined /> 管理员管理</span>,
      children: (
        <>
          <div style={{ marginBottom: 16 }}>
            <Button 
              type="primary" 
              icon={<PlusOutlined />}
              onClick={() => setCreateAdminModal(true)}
            >
              新增管理员
            </Button>
          </div>
          <Table
            columns={adminColumns}
            dataSource={admins}
            rowKey="id"
            loading={adminsLoading}
            pagination={{
              current: adminsPage,
              total: adminsTotal,
              pageSize: 10,
              onChange: setAdminsPage,
            }}
          />
        </>
      ),
    }] : []),
  ]

  return (
    <div className={styles.container}>
      <Card>
        <div className={styles.header}>
          <Title level={3}>🔧 管理后台</Title>
        </div>
        <Tabs
          activeKey={activeTab}
          onChange={(key) => setSearchParams({ tab: key })}
          items={tabItems}
        />
      </Card>

      <Modal
        title="编辑标签"
        open={editTagModal}
        onCancel={() => setEditTagModal(false)}
        footer={null}
      >
        <Form form={tagForm} onFinish={handleEditTag} layout="vertical">
          <Form.Item
            name="name"
            label="标签名称"
            rules={[
              { required: true, message: '请输入标签名称' },
              { max: 20, message: '标签名称最多20个字符' }
            ]}
          >
            <Input placeholder="请输入标签名称" maxLength={20} />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setEditTagModal(false)}>取消</Button>
              <Button type="primary" htmlType="submit" loading={editTagLoading}>
                保存
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="新增标签"
        open={createTagModal}
        onCancel={() => setCreateTagModal(false)}
        footer={null}
      >
        <Form form={createTagForm} onFinish={handleCreateTag} layout="vertical">
          <Form.Item
            name="name"
            label="标签名称"
            rules={[
              { required: true, message: '请输入标签名称' },
              { max: 20, message: '标签名称最多20个字符' }
            ]}
          >
            <Input placeholder="请输入标签名称" maxLength={20} />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setCreateTagModal(false)}>取消</Button>
              <Button type="primary" htmlType="submit" loading={createTagLoading}>
                创建
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 编辑图片标签弹窗 */}
      <Modal
        title="编辑图片标签"
        open={editImageTagModal}
        onCancel={() => setEditImageTagModal(false)}
        footer={null}
      >
        <Form form={imageTagForm} onFinish={handleEditImageTag} layout="vertical">
          <Form.Item
            name="name"
            label="标签名称"
            rules={[
              { required: true, message: '请输入标签名称' },
              { max: 20, message: '标签名称最多20个字符' }
            ]}
          >
            <Input placeholder="请输入标签名称" maxLength={20} />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setEditImageTagModal(false)}>取消</Button>
              <Button type="primary" htmlType="submit" loading={editImageTagLoading}>
                保存
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 新增图片标签弹窗 */}
      <Modal
        title="新增图片标签"
        open={createImageTagModal}
        onCancel={() => setCreateImageTagModal(false)}
        footer={null}
      >
        <Form form={createImageTagForm} onFinish={handleCreateImageTag} layout="vertical">
          <Form.Item
            name="name"
            label="标签名称"
            rules={[
              { required: true, message: '请输入标签名称' },
              { max: 20, message: '标签名称最多20个字符' }
            ]}
          >
            <Input placeholder="请输入标签名称" maxLength={20} />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setCreateImageTagModal(false)}>取消</Button>
              <Button type="primary" htmlType="submit" loading={createImageTagLoading}>
                创建
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 新增管理员弹窗 */}
      <Modal
        title="新增管理员"
        open={createAdminModal}
        onCancel={() => setCreateAdminModal(false)}
        footer={null}
      >
        <Form form={createAdminForm} onFinish={handleCreateAdmin} layout="vertical" initialValues={{ role: 'ADMIN' }}>
          <Form.Item
            name="email"
            label="邮箱"
            rules={[
              { required: true, message: '请输入邮箱' },
              { type: 'email', message: '请输入有效的邮箱地址' }
            ]}
          >
            <Input placeholder="请输入邮箱" />
          </Form.Item>
          <Form.Item
            name="username"
            label="用户名"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input placeholder="请输入用户名" />
          </Form.Item>
          <Form.Item
            name="password"
            label="密码"
            rules={[
              { required: true, message: '请输入密码' },
              { min: 6, message: '密码至少6位' }
            ]}
          >
            <Input.Password placeholder="请输入密码" />
          </Form.Item>
          <Form.Item
            name="role"
            label="角色"
            rules={[{ required: true, message: '请选择角色' }]}
          >
            <Select>
              <Select.Option value="ADMIN">
                <CrownOutlined /> 管理员
              </Select.Option>
              <Select.Option value="SUPER_ADMIN">
                <SafetyCertificateOutlined /> 超级管理员
              </Select.Option>
            </Select>
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setCreateAdminModal(false)}>取消</Button>
              <Button type="primary" htmlType="submit" loading={createAdminLoading}>
                创建
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 编辑管理员弹窗 */}
      <Modal
        title="编辑管理员"
        open={editAdminModal}
        onCancel={() => setEditAdminModal(false)}
        footer={null}
      >
        <Form form={editAdminForm} onFinish={handleEditAdmin} layout="vertical">
          <Form.Item
            name="email"
            label="邮箱"
            rules={[{ type: 'email', message: '请输入有效的邮箱地址' }]}
          >
            <Input placeholder="请输入邮箱" />
          </Form.Item>
          <Form.Item
            name="username"
            label="用户名"
          >
            <Input placeholder="请输入用户名" />
          </Form.Item>
          <Form.Item
            name="password"
            label="新密码"
            extra="留空则不修改密码"
            rules={[{ min: 6, message: '密码至少6位' }]}
          >
            <Input.Password placeholder="请输入新密码（可选）" />
          </Form.Item>
          <Form.Item
            name="role"
            label="角色"
          >
            <Select>
              <Select.Option value="ADMIN">
                <CrownOutlined /> 管理员
              </Select.Option>
              <Select.Option value="SUPER_ADMIN">
                <SafetyCertificateOutlined /> 超级管理员
              </Select.Option>
            </Select>
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setEditAdminModal(false)}>取消</Button>
              <Button type="primary" htmlType="submit" loading={editAdminLoading}>
                保存
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
