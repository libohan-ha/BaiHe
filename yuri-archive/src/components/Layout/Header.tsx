import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Layout, Input, Avatar, Dropdown, Button, Drawer, Space, message } from 'antd'
import { SearchOutlined, UserOutlined, MenuOutlined, HomeOutlined, EditOutlined, HeartOutlined, LogoutOutlined, LoginOutlined, SettingOutlined, MenuFoldOutlined, MenuUnfoldOutlined, FileTextOutlined, PictureOutlined } from '@ant-design/icons'
import type { MenuProps } from 'antd'
import { useUserStore } from '../../store'
import { getImageUrl } from '../../services/api'
import styles from './Header.module.css'

const { Header: AntHeader } = Layout

interface HeaderProps {
  sidebarCollapsed?: boolean
  onToggleSidebar?: () => void
}

export function Header({ sidebarCollapsed = false, onToggleSidebar }: HeaderProps) {
  const navigate = useNavigate()
  const { currentUser, isLoggedIn, logout } = useUserStore()
  const [searchValue, setSearchValue] = useState('')
  const [drawerOpen, setDrawerOpen] = useState(false)

  const isAdmin = currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPER_ADMIN'

  const handleSearch = (value: string) => {
    if (value.trim()) {
      navigate(`/search?q=${encodeURIComponent(value.trim())}`)
      setSearchValue('')
      setDrawerOpen(false)
    }
  }

  const handleLogout = () => {
    logout()
    message.success('已退出登录')
    navigate('/')
  }

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'create',
      icon: <EditOutlined />,
      label: '投稿文章',
      onClick: () => navigate('/create'),
    },
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人中心',
      onClick: () => navigate('/user'),
    },
    {
      key: 'collections',
      icon: <HeartOutlined />,
      label: '我的收藏',
      onClick: () => navigate('/user?tab=collections'),
    },
    ...(isAdmin ? [{
      key: 'admin',
      icon: <SettingOutlined />,
      label: '管理后台',
      onClick: () => navigate('/admin'),
    }] : []),
    {
      type: 'divider' as const,
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      danger: true,
      onClick: handleLogout,
    },
  ]

  // 导航菜单项（始终显示）
  const navigationMenuItems = [
    {
      key: 'articles',
      icon: <FileTextOutlined />,
      label: '文章',
      onClick: () => { navigate('/'); setDrawerOpen(false) },
    },
    {
      key: 'gallery',
      icon: <PictureOutlined />,
      label: '图片画廊',
      onClick: () => { navigate('/gallery'); setDrawerOpen(false) },
    },
  ]

  const mobileMenuItems = isLoggedIn ? [
    ...navigationMenuItems,
    { key: 'divider-1', type: 'divider' as const },
    {
      key: 'create',
      icon: <EditOutlined />,
      label: '投稿文章',
      onClick: () => { navigate('/create'); setDrawerOpen(false) },
    },
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人中心',
      onClick: () => { navigate('/user'); setDrawerOpen(false) },
    },
    {
      key: 'collections',
      icon: <HeartOutlined />,
      label: '我的收藏',
      onClick: () => { navigate('/user?tab=collections'); setDrawerOpen(false) },
    },
    ...(isAdmin ? [{
      key: 'admin',
      icon: <SettingOutlined />,
      label: '管理后台',
      onClick: () => { navigate('/admin'); setDrawerOpen(false) },
    }] : []),
    { key: 'divider-2', type: 'divider' as const },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: () => { handleLogout(); setDrawerOpen(false) },
    },
  ] : [
    ...navigationMenuItems,
    { key: 'divider-1', type: 'divider' as const },
    {
      key: 'login',
      icon: <LoginOutlined />,
      label: '登录',
      onClick: () => { navigate('/login'); setDrawerOpen(false) },
    },
    {
      key: 'register',
      icon: <EditOutlined />,
      label: '注册',
      onClick: () => { navigate('/register'); setDrawerOpen(false) },
    },
  ]

  return (
    <AntHeader className={styles.header}>
      <div className={styles.container}>
        {/* Logo 区域 */}
        <div className={`${styles.logoArea} ${sidebarCollapsed ? styles.logoAreaCollapsed : ''}`}>
          {sidebarCollapsed ? (
            <>
              <Button
                type="text"
                icon={<MenuUnfoldOutlined />}
                onClick={onToggleSidebar}
                className={styles.toggleButton}
              />
              <Link to="/" className={styles.logo}>
                <span className={styles.logoIcon}>🌸</span>
              </Link>
            </>
          ) : (
            <>
              <Button
                type="text"
                icon={<MenuFoldOutlined />}
                onClick={onToggleSidebar}
                className={styles.toggleButton}
              />
              <Link to="/" className={styles.logo}>
                <span className={styles.logoIcon}>🌸</span>
                <span className={styles.logoText}>百合文学档案馆</span>
              </Link>
            </>
          )}
        </div>

        {/* 桌面端搜索框 */}
        <div className={styles.searchWrapper}>
          <Input.Search
            placeholder="搜索文章..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onSearch={handleSearch}
            enterButton={<SearchOutlined />}
            className={styles.searchInput}
          />
        </div>

        {/* 桌面端用户区域 */}
        <div className={styles.userArea}>
          {isLoggedIn && currentUser ? (
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <div className={styles.userInfo}>
                <Avatar
                  src={getImageUrl(currentUser.avatarUrl)}
                  icon={<UserOutlined />}
                  size="small"
                />
                <span className={styles.username}>{currentUser.username}</span>
              </div>
            </Dropdown>
          ) : (
            <Space>
              <Button onClick={() => navigate('/login')}>
                登录
              </Button>
              <Button type="primary" onClick={() => navigate('/register')}>
                注册
              </Button>
            </Space>
          )}
        </div>

        {/* 移动端菜单按钮 */}
        <Button
          className={styles.menuButton}
          type="text"
          icon={<MenuOutlined />}
          onClick={() => setDrawerOpen(true)}
        />

        {/* 移动端抽屉菜单 */}
        <Drawer
          title="菜单"
          placement="right"
          onClose={() => setDrawerOpen(false)}
          open={drawerOpen}
          size="default"
        >
          {/* 移动端搜索框 */}
          <Input.Search
            placeholder="搜索文章..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onSearch={handleSearch}
            enterButton={<SearchOutlined />}
            style={{ marginBottom: 16 }}
          />
          
          {/* 用户信息 */}
          {isLoggedIn && currentUser && (
            <div className={styles.drawerUser}>
              <Avatar
                src={getImageUrl(currentUser.avatarUrl)}
                icon={<UserOutlined />}
                size={48}
              />
              <div className={styles.drawerUserInfo}>
                <div className={styles.drawerUsername}>{currentUser.username}</div>
                <div className={styles.drawerBio}>{currentUser.bio || '暂无简介'}</div>
              </div>
            </div>
          )}

          {/* 菜单项 */}
          <div className={styles.drawerMenu}>
            {mobileMenuItems.map(item => (
              'type' in item && item.type === 'divider' ? (
                <div key={item.key} className={styles.drawerDivider} />
              ) : (
                <div
                  key={item.key}
                  className={styles.drawerMenuItem}
                  onClick={'onClick' in item ? item.onClick : undefined}
                >
                  {'icon' in item && item.icon}
                  <span>{'label' in item && item.label}</span>
                </div>
              )
            ))}
          </div>
        </Drawer>
      </div>
    </AntHeader>
  )
}
