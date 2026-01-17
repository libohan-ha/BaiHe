import React from 'react'
import { Avatar, Button, Form, Input, Modal, Select, Slider, Spin, Upload } from 'antd'
import { UploadOutlined } from '@ant-design/icons'
import type { UploadProps } from 'antd'
import { getImageUrl } from '../../../services/api'
import styles from '../AIChatRoomPage.module.css'

interface EditCharacterModalProps {
  visible: boolean
  onClose: () => void
  form: any
  onSubmit: (values: any) => void
  // 头像相关
  avatarUrl: string
  avatarUploading: boolean
  onAvatarUpload: UploadProps['customRequest']
  // 用户头像相关
  userAvatarUrl: string
  userAvatarUploading: boolean
  onUserAvatarUpload: UploadProps['customRequest']
  // 背景相关
  backgroundUrl: string
  backgroundUploading: boolean
  onBackgroundUpload: UploadProps['customRequest']
}

export const EditCharacterModal: React.FC<EditCharacterModalProps> = ({
  visible,
  onClose,
  form,
  onSubmit,
  avatarUrl,
  avatarUploading,
  onAvatarUpload,
  userAvatarUrl,
  userAvatarUploading,
  onUserAvatarUpload,
  backgroundUrl,
  backgroundUploading,
  onBackgroundUpload,
}) => {
  return (
    <Modal title="编辑角色" open={visible} onCancel={onClose} footer={null} width={600}>
      <p style={{ color: '#666', marginBottom: 16 }}>编辑角色的信息和设置。</p>
      <Form form={form} layout="vertical" onFinish={onSubmit}>
        <Form.Item name="name" label="角色名称" rules={[{ required: true }]}>
          <Input />
        </Form.Item>

        {/* 图片上传区域 */}
        <div className={styles.uploadSection}>
          <div className={styles.uploadItem}>
            <div className={styles.uploadLabel}>角色头像</div>
            <Upload
              accept="image/*"
              showUploadList={false}
              customRequest={onAvatarUpload}
            >
              <div className={styles.uploadBox}>
                {avatarUrl ? (
                  <Avatar size={80} src={getImageUrl(avatarUrl)} />
                ) : (
                  <div className={styles.uploadPlaceholder}>
                    {avatarUploading ? <Spin size="small" /> : <UploadOutlined />}
                    <span>上传头像</span>
                  </div>
                )}
              </div>
            </Upload>
          </div>

          <div className={styles.uploadItem}>
            <div className={styles.uploadLabel}>用户头像</div>
            <Upload
              accept="image/*"
              showUploadList={false}
              customRequest={onUserAvatarUpload}
            >
              <div className={styles.uploadBox}>
                {userAvatarUrl ? (
                  <Avatar size={80} src={getImageUrl(userAvatarUrl)} />
                ) : (
                  <div className={styles.uploadPlaceholder}>
                    {userAvatarUploading ? <Spin size="small" /> : <UploadOutlined />}
                    <span>上传头像</span>
                  </div>
                )}
              </div>
            </Upload>
            <div className={styles.uploadHint}>聊天时显示的你的头像</div>
          </div>

          <div className={styles.uploadItem}>
            <div className={styles.uploadLabel}>聊天背景</div>
            <Upload
              accept="image/*"
              showUploadList={false}
              customRequest={onBackgroundUpload}
            >
              <div className={styles.uploadBoxWide}>
                {backgroundUrl ? (
                  <img src={getImageUrl(backgroundUrl)} alt="背景" className={styles.backgroundPreview} />
                ) : (
                  <div className={styles.uploadPlaceholder}>
                    {backgroundUploading ? <Spin size="small" /> : <UploadOutlined />}
                    <span>上传背景图片</span>
                  </div>
                )}
              </div>
            </Upload>
          </div>
        </div>

        <Form.Item name="prompt" label="角色提示词" rules={[{ required: true }]}>
          <Input.TextArea rows={4} />
        </Form.Item>

        <Form.Item name="modelName" label="AI 模型" initialValue="deepseek-chat">
          <Select>
            <Select.Option value="deepseek-chat">DeepSeek</Select.Option>
            <Select.Option value="claude-opus-4-5-thinking">Claude</Select.Option>
            <Select.Option value="qwen3-max">Qwen</Select.Option>
            <Select.Option value="gpt-5.2">GPT</Select.Option>
            <Select.Option value="gemini-3-pro-high">Gemini</Select.Option>
            <Select.Option value="deepseek-v3.2-chat">DeepSeek V3</Select.Option>
            <Select.Option value="qwen3-coder-plus">Qwen Coder</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item name="bubbleOpacity" label="气泡透明度">
          <Slider min={0} max={100} marks={{ 0: '透明', 50: '半透明', 100: '不透明' }} />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" block>保存</Button>
        </Form.Item>
      </Form>
    </Modal>
  )
}
