import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Form, Input, Button, Card, Typography, message, Divider } from 'antd'
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons'
import { register } from '../../services/api'
import { useUserStore } from '../../store'
import styles from './RegisterPage.module.css'

const { Title, Text } = Typography

interface RegisterForm {
  email: string
  username: string
  password: string
  confirmPassword: string
}

export function RegisterPage() {
  const navigate = useNavigate()
  const { setUser } = useUserStore()
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (values: RegisterForm) => {
    setLoading(true)
    try {
      const res = await register(values.email, values.username, values.password)
      setUser(res.user, res.token)
      message.success('注册成功')
      navigate('/')
    } catch (err) {
      message.error(err instanceof Error ? err.message : '注册失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.container}>
      <Card className={styles.card}>
        <div className={styles.header}>
          <span className={styles.logo}>🌸</span>
          <Title level={2} className={styles.title}>加入我们</Title>
          <Text type="secondary">创建百合文学档案馆账号</Text>
        </div>

        <Form
          name="register"
          onFinish={handleSubmit}
          size="large"
          layout="vertical"
        >
          <Form.Item
            name="email"
            rules={[
              { required: true, message: '请输入邮箱' },
              { type: 'email', message: '请输入有效的邮箱地址' }
            ]}
          >
            <Input
              prefix={<MailOutlined />}
              placeholder="邮箱"
            />
          </Form.Item>

          <Form.Item
            name="username"
            rules={[
              { required: true, message: '请输入用户名' },
              { min: 2, message: '用户名至少2个字符' },
              { max: 20, message: '用户名最多20个字符' }
            ]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="用户名"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[
              { required: true, message: '请输入密码' },
              { min: 6, message: '密码至少6个字符' }
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="密码"
            />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            dependencies={['password']}
            rules={[
              { required: true, message: '请确认密码' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve()
                  }
                  return Promise.reject(new Error('两次输入的密码不一致'))
                },
              }),
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="确认密码"
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
            >
              注册
            </Button>
          </Form.Item>
        </Form>

        <Divider plain>
          <Text type="secondary">已有账号？</Text>
        </Divider>

        <Link to="/login">
          <Button block>
            返回登录
          </Button>
        </Link>
      </Card>
    </div>
  )
}
