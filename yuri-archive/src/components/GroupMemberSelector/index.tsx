import React, { useState, useEffect } from 'react'
import { Modal, Checkbox, Avatar, Empty, Spin, message } from 'antd'
import { UserOutlined } from '@ant-design/icons'
import { getAICharacters, getImageUrl } from '../../services/api'
import type { AICharacter } from '../../types'
import styles from './GroupMemberSelector.module.css'

interface GroupMemberSelectorProps {
  open: boolean
  onClose: () => void
  onConfirm: (selectedIds: string[]) => void
  excludeIds?: string[] // 排除的角色ID（如已在群聊中的成员）
  title?: string
  confirmText?: string
}

const GroupMemberSelector: React.FC<GroupMemberSelectorProps> = ({
  open,
  onClose,
  onConfirm,
  excludeIds = [],
  title = '选择AI成员',
  confirmText = '确定'
}) => {
  const [characters, setCharacters] = useState<AICharacter[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  // 加载用户的AI角色列表
  useEffect(() => {
    if (open) {
      loadCharacters()
    }
  }, [open])

  const loadCharacters = async () => {
    setLoading(true)
    try {
      const data = await getAICharacters()
      // 过滤掉排除的角色
      const filtered = data.filter(c => !excludeIds.includes(c.id))
      setCharacters(filtered)
    } catch {
      message.error('加载AI角色失败')
    } finally {
      setLoading(false)
    }
  }

  const handleToggle = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id)
        ? prev.filter(i => i !== id)
        : [...prev, id]
    )
  }

  const handleSelectAll = () => {
    if (selectedIds.length === characters.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(characters.map(c => c.id))
    }
  }

  const handleConfirm = () => {
    if (selectedIds.length === 0) {
      message.warning('请至少选择一个AI成员')
      return
    }
    onConfirm(selectedIds)
    setSelectedIds([])
    onClose()
  }

  const handleCancel = () => {
    setSelectedIds([])
    onClose()
  }

  return (
    <Modal
      title={title}
      open={open}
      onOk={handleConfirm}
      onCancel={handleCancel}
      okText={confirmText}
      cancelText="取消"
      width={480}
      className={styles.modal}
    >
      {loading ? (
        <div className={styles.loading}>
          <Spin />
        </div>
      ) : characters.length === 0 ? (
        <Empty
          description="暂无可选的AI角色"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      ) : (
        <>
          <div className={styles.selectAllRow}>
            <Checkbox
              checked={selectedIds.length === characters.length}
              indeterminate={selectedIds.length > 0 && selectedIds.length < characters.length}
              onChange={handleSelectAll}
            >
              全选 ({selectedIds.length}/{characters.length})
            </Checkbox>
          </div>
          <div className={styles.characterList}>
            {characters.map(character => (
              <div
                key={character.id}
                className={`${styles.characterItem} ${selectedIds.includes(character.id) ? styles.selected : ''}`}
                onClick={() => handleToggle(character.id)}
              >
                <Checkbox
                  checked={selectedIds.includes(character.id)}
                  onClick={e => e.stopPropagation()}
                  onChange={() => handleToggle(character.id)}
                />
                <Avatar
                  src={getImageUrl(character.avatarUrl)}
                  icon={<UserOutlined />}
                  size={40}
                  className={styles.avatar}
                />
                <div className={styles.characterInfo}>
                  <div className={styles.characterName}>{character.name}</div>
                  <div className={styles.characterModel}>{character.modelName}</div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </Modal>
  )
}

export default GroupMemberSelector
