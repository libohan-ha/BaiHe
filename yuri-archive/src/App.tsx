import { ConfigProvider, App as AntApp, message } from 'antd'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import zhCN from 'antd/locale/zh_CN'
import { Layout } from './components/Layout'
import {
  HomePage,
  ArticleDetailPage,
  SearchPage,
  TagPage,
  UserCenterPage,
  LoginPage,
  RegisterPage,
  CreateArticlePage,
  EditArticlePage,
  AdminPage,
  GalleryPage,
  ImageDetailPage,
  UploadImagePage,
  EditImagePage
} from './pages'
import './App.css'

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
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<HomePage />} />
              <Route path="article/:id" element={<ArticleDetailPage />} />
              <Route path="search" element={<SearchPage />} />
              <Route path="tag/:id" element={<TagPage />} />
              <Route path="user" element={<UserCenterPage />} />
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
            </Route>
          </Routes>
        </BrowserRouter>
      </AntApp>
    </ConfigProvider>
  )
}

export default App
