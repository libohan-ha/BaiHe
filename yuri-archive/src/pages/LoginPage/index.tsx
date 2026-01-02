import { LockOutlined, UserOutlined } from '@ant-design/icons'
import { Button, Card, Divider, Form, Input, Typography, message } from 'antd'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { login } from '../../services/api'
import { useUserStore } from '../../store'
import styles from './LoginPage.module.css'

const { Title, Text } = Typography

interface LoginForm {
  identifier: string
  password: string
}

export function LoginPage() {
  const navigate = useNavigate()
  const { setUser } = useUserStore()
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (values: LoginForm) => {
    setLoading(true)
    try {
      const res = await login(values.identifier, values.password)
      setUser(res.user, res.token)
      message.success('登录成功')
      navigate('/')
    } catch (err) {
      message.error(err instanceof Error ? err.message : '登录失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.container}>
      <Card className={styles.card}>
        <div className={styles.header}>
          <span className={styles.logo}>🌸</span>
          <Title level={2} className={styles.title}>欢迎回来</Title>
          <Text type="secondary">登录百合文学档案馆</Text>
        </div>

        <Form
          name="login"
          onFinish={handleSubmit}
          size="large"
          layout="vertical"
        >
          <Form.Item
            name="identifier"
            rules={[
              { required: true, message: '请输入邮箱或用户名' }
            ]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="邮箱或用户名"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="密码"
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
            >
              登录
            </Button>
          </Form.Item>
        </Form>

        <Divider plain>
          <Text type="secondary">还没有账号？</Text>
        </Divider>

        <Link to="/register">
          <Button block icon={<UserOutlined />}>
            注册新账号
          </Button>
        </Link>
      </Card>
    </div>
  )
}
