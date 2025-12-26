import { useState } from 'react'
import { Layout as AntLayout } from 'antd'
import { Outlet } from 'react-router-dom'
import { Header } from './Header'
import { Footer } from './Footer'
import { Sidebar } from '../Sidebar'
import styles from './Layout.module.css'

const { Content } = AntLayout

export function Layout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

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
      <Footer />
    </AntLayout>
  )
}

export { Header } from './Header'
export { Footer } from './Footer'
export { Sidebar } from '../Sidebar'
