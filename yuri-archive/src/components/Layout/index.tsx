import { useState, useEffect } from 'react'
import { Layout as AntLayout } from 'antd'
import { Outlet, useLocation } from 'react-router-dom'
import { Header } from './Header'
import { Footer } from './Footer'
import { Sidebar } from '../Sidebar'
import styles from './Layout.module.css'

const { Content } = AntLayout

// 移动端断点
const MOBILE_BREAKPOINT = 768

export function Layout() {
  const location = useLocation()
  // 判断是否在 AI 聊天室页面（/ai-chat/:characterId）
  const isAIChatRoom = /^\/ai-chat\/[^/]+$/.test(location.pathname)
  
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    // 初始状态：移动端默认收起
    return typeof window !== 'undefined' && window.innerWidth < MOBILE_BREAKPOINT
  })
  const [isMobile, setIsMobile] = useState(() => {
    return typeof window !== 'undefined' && window.innerWidth < MOBILE_BREAKPOINT
  })

  // 监听窗口大小变化
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < MOBILE_BREAKPOINT
      const wasMobile = isMobile
      setIsMobile(mobile)
      
      // 当从移动端变为桌面端时，自动展开侧边栏
      if (wasMobile && !mobile) {
        setSidebarCollapsed(false)
      }
      // 当从桌面端进入移动端时，自动收起侧边栏
      if (!wasMobile && mobile) {
        setSidebarCollapsed(true)
      }
    }

    window.addEventListener('resize', handleResize)
    // 初始检查
    handleResize()

    return () => window.removeEventListener('resize', handleResize)
  }, [isMobile])

  return (
    <AntLayout className={styles.layout}>
      <Header sidebarCollapsed={sidebarCollapsed} onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)} />
      <AntLayout className={styles.mainLayout}>
        <Sidebar collapsed={sidebarCollapsed} />
        <Content className={`${styles.content} ${sidebarCollapsed ? styles.contentCollapsed : ''}`}>
          <div className={styles.container}>
            <Outlet />
          </div>
        </Content>
      </AntLayout>
      {!isAIChatRoom && <Footer />}
    </AntLayout>
  )
}

export { Header } from './Header'
export { Footer } from './Footer'
export { Sidebar } from '../Sidebar'
