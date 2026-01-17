import {
  CommentOutlined,
  FileTextOutlined,
  LockOutlined,
  PictureOutlined,
  RobotOutlined,
} from '@ant-design/icons'
import type { MenuProps } from 'antd'
import { Menu } from 'antd'
import { useLocation, useNavigate } from 'react-router-dom'
import { useUserStore } from '../../store/userStore'
import styles from './Sidebar.module.css'

type MenuItem = Required<MenuProps>['items'][number]

// 基础菜单项
const baseMenuItems: MenuItem[] = [
  {
    key: 'articles',
    icon: <FileTextOutlined />,
    label: '文章',
  },
  {
    key: 'gallery',
    icon: <PictureOutlined />,
    label: '图片',
  },
  {
    key: 'ai-chat',
    icon: <RobotOutlined />,
    label: 'AI聊天',
  },
  {
    key: 'chat',
    icon: <CommentOutlined />,
    label: '聊天室',
  },
]

// 隐私相册菜单项（需要登录才显示）
const privateGalleryItem: MenuItem = {
  key: 'private-gallery',
  icon: <LockOutlined />,
  label: '隐私相册',
}

interface SidebarProps {
  collapsed?: boolean
}

export function Sidebar({ collapsed = false }: SidebarProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const { isLoggedIn } = useUserStore()

  // 根据登录状态动态生成菜单项
  const menuItems: MenuItem[] = isLoggedIn
    ? [...baseMenuItems, privateGalleryItem]
    : baseMenuItems

  // 根据当前路径确定选中的菜单项
  const getSelectedKey = () => {
    if (location.pathname.startsWith('/private-gallery') || location.pathname.startsWith('/private-image')) {
      return 'private-gallery'
    }
    if (location.pathname.startsWith('/gallery') || location.pathname.startsWith('/image')) {
      return 'gallery'
    }
    if (location.pathname.startsWith('/ai-chat')) {
      return 'ai-chat'
    }
    if (location.pathname.startsWith('/public-chat')) {
      return 'chat'
    }
    return 'articles'
  }

  const handleMenuClick: MenuProps['onClick'] = ({ key }) => {
    if (key === 'articles') {
      navigate('/')
    } else if (key === 'gallery') {
      navigate('/gallery')
    } else if (key === 'ai-chat') {
      navigate('/ai-chat')
    } else if (key === 'private-gallery') {
      navigate('/private-gallery')
    } else if (key === 'chat') {
      navigate('/public-chat')
    }
  }

  return (
    <div className={`${styles.sidebar} ${collapsed ? styles.collapsed : ''}`}>
      <Menu
        mode="inline"
        selectedKeys={[getSelectedKey()]}
        items={menuItems}
        onClick={handleMenuClick}
        inlineCollapsed={collapsed}
        className={styles.menu}
      />
    </div>
  )
}