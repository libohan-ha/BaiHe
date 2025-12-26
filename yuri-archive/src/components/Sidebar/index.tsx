import { useNavigate, useLocation } from 'react-router-dom'
import { Menu } from 'antd'
import {
  FileTextOutlined,
  PictureOutlined,
} from '@ant-design/icons'
import type { MenuProps } from 'antd'
import styles from './Sidebar.module.css'

type MenuItem = Required<MenuProps>['items'][number]

const menuItems: MenuItem[] = [
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
]

interface SidebarProps {
  collapsed?: boolean
}

export function Sidebar({ collapsed = false }: SidebarProps) {
  const navigate = useNavigate()
  const location = useLocation()

  // 根据当前路径确定选中的菜单项
  const getSelectedKey = () => {
    if (location.pathname.startsWith('/gallery') || location.pathname.startsWith('/image')) {
      return 'gallery'
    }
    return 'articles'
  }

  const handleMenuClick: MenuProps['onClick'] = ({ key }) => {
    if (key === 'articles') {
      navigate('/')
    } else if (key === 'gallery') {
      navigate('/gallery')
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