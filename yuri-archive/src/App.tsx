import { App as AntApp, ConfigProvider, message } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import './App.css'
import { BGMPlayer, Layout } from './components'
import {
  AdminPage,
  AIChatPage,
  AIChatRoomPage,
  ArticleDetailPage,
  CreateArticlePage,
  EditArticlePage,
  EditImagePage,
  GalleryPage,
  HomePage,
  ImageDetailPage,
  LoginPage,
  RegisterPage,
  SearchPage,
  TagPage,
  UploadImagePage,
  UserCenterPage,
  UserProfilePage
} from './pages'

// 百合主题配色 - 柔和的粉紫色系
const theme = {
  token: {
    colorPrimary: '#c084fc',
    colorLink: '#a855f7',
    colorSuccess: '#86efac',
    colorWarning: '#fcd34d',
    colorError: '#f87171',
    borderRadius: 8,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
  components: {
    Card: {
      colorBgContainer: '#fefefe',
    },
    Layout: {
      headerBg: '#ffffff',
      bodyBg: '#faf5ff',
      footerBg: '#faf5ff',
    },
  },
}

// 配置静态方法使用的容器
message.config({
  top: 60,
  maxCount: 3,
})

function App() {
  return (
    <ConfigProvider theme={theme} locale={zhCN}>
      <AntApp>
        <BrowserRouter>
          {/* 全局 BGM 播放器 */}
          <BGMPlayer />
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<HomePage />} />
              <Route path="article/:id" element={<ArticleDetailPage />} />
              <Route path="search" element={<SearchPage />} />
              <Route path="tag/:id" element={<TagPage />} />
              <Route path="user" element={<UserCenterPage />} />
              <Route path="user/:id" element={<UserProfilePage />} />
              <Route path="login" element={<LoginPage />} />
              <Route path="register" element={<RegisterPage />} />
              <Route path="create" element={<CreateArticlePage />} />
              <Route path="edit/:id" element={<EditArticlePage />} />
              <Route path="admin" element={<AdminPage />} />
              {/* 图片画廊相关路由 */}
              <Route path="gallery" element={<GalleryPage />} />
              <Route path="image/:id" element={<ImageDetailPage />} />
              <Route path="upload-image" element={<UploadImagePage />} />
              <Route path="edit-image/:id" element={<EditImagePage />} />
              {/* AI聊天相关路由 */}
              <Route path="ai-chat" element={<AIChatPage />} />
              <Route path="ai-chat/:characterId" element={<AIChatRoomPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AntApp>
    </ConfigProvider>
  )
}

export default App
