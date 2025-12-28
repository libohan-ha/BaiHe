import { useState, useRef, useEffect, useCallback } from 'react'
import { CustomerServiceOutlined, PauseCircleOutlined, PlayCircleOutlined, StepBackwardOutlined, StepForwardOutlined, SoundOutlined, RetweetOutlined, SwapOutlined, OrderedListOutlined } from '@ant-design/icons'
import { Slider, Tooltip } from 'antd'
import styles from './BGMPlayer.module.css'

// BGM 列表配置 - 用户可以在这里添加更多音频
// 音频文件放在 public/audio/ 目录下
const BGM_LIST = [
  { id: 1, name: '歌曲1', src: '/audio/歌曲1.mp3' },
  { id: 2, name: 'BGM 2', src: '/audio/bgm2.mp3' },
  { id: 3, name: 'BGM 3', src: '/audio/bgm3.mp3' },
]

// 播放模式类型
type PlayMode = 'sequence' | 'loop' | 'shuffle'

// 播放模式配置
const PLAY_MODES: { mode: PlayMode; label: string; icon: React.ReactNode }[] = [
  { mode: 'sequence', label: '顺序播放', icon: <OrderedListOutlined /> },
  { mode: 'loop', label: '单曲循环', icon: <RetweetOutlined /> },
  { mode: 'shuffle', label: '随机播放', icon: <SwapOutlined /> },
]

export function BGMPlayer() {
  const audioRef = useRef<HTMLAudioElement>(null)
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  
  const [isExpanded, setIsExpanded] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [volume, setVolume] = useState(() => {
    const saved = localStorage.getItem('bgm-volume')
    return saved ? Number(saved) : 50
  })
  const [playMode, setPlayMode] = useState<PlayMode>(() => {
    const saved = localStorage.getItem('bgm-playmode')
    return (saved as PlayMode) || 'sequence'
  })

  const currentBGM = BGM_LIST[currentIndex]
  const currentModeConfig = PLAY_MODES.find(m => m.mode === playMode) || PLAY_MODES[0]

  // 重置自动隐藏计时器
  const resetHideTimer = useCallback(() => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current)
    }
    hideTimerRef.current = setTimeout(() => {
      setIsExpanded(false)
    }, 3000)
  }, [])

  // 点击展开/收起
  const handleToggle = () => {
    if (!isExpanded) {
      setIsExpanded(true)
      resetHideTimer()
    } else {
      setIsExpanded(false)
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current)
      }
    }
  }

  // 面板内交互时重置计时器
  const handlePanelInteraction = () => {
    if (isExpanded) {
      resetHideTimer()
    }
  }

  // 播放/暂停
  const handlePlayPause = () => {
    handlePanelInteraction()
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
      } else {
        audioRef.current.play().catch(() => {
          // 浏览器可能阻止自动播放，忽略错误
        })
      }
      setIsPlaying(!isPlaying)
    }
  }

  // 上一首
  const handlePrev = () => {
    handlePanelInteraction()
    const newIndex = currentIndex === 0 ? BGM_LIST.length - 1 : currentIndex - 1
    setCurrentIndex(newIndex)
  }

  // 下一首
  const handleNext = useCallback(() => {
    handlePanelInteraction()
    let newIndex: number
    
    if (playMode === 'shuffle') {
      // 随机播放：随机选择一个不同的歌曲
      if (BGM_LIST.length <= 1) {
        newIndex = 0
      } else {
        do {
          newIndex = Math.floor(Math.random() * BGM_LIST.length)
        } while (newIndex === currentIndex)
      }
    } else {
      // 顺序播放和循环播放：按顺序切换
      newIndex = currentIndex === BGM_LIST.length - 1 ? 0 : currentIndex + 1
    }
    
    setCurrentIndex(newIndex)
  }, [currentIndex, playMode])

  // 音量调节
  const handleVolumeChange = (value: number) => {
    handlePanelInteraction()
    setVolume(value)
    localStorage.setItem('bgm-volume', String(value))
    if (audioRef.current) {
      audioRef.current.volume = value / 100
    }
  }

  // 音频结束时处理
  const handleEnded = useCallback(() => {
    if (playMode === 'loop') {
      // 单曲循环：重新播放当前歌曲
      if (audioRef.current) {
        audioRef.current.currentTime = 0
        audioRef.current.play().catch(() => {})
      }
    } else {
      // 顺序播放或随机播放：继续下一首
      handleNext()
    }
  }, [playMode, handleNext])

  // 切换播放模式
  const handleModeChange = () => {
    handlePanelInteraction()
    const modeIndex = PLAY_MODES.findIndex(m => m.mode === playMode)
    const nextIndex = (modeIndex + 1) % PLAY_MODES.length
    const nextMode = PLAY_MODES[nextIndex].mode
    setPlayMode(nextMode)
    localStorage.setItem('bgm-playmode', nextMode)
  }

  // 当歌曲切换时重新播放
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100
      if (isPlaying) {
        audioRef.current.play().catch(() => {})
      }
    }
  }, [currentIndex])

  // 初始化音量
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100
    }
  }, [])

  // 清理定时器
  useEffect(() => {
    return () => {
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current)
      }
    }
  }, [])

  return (
    <div className={styles.container}>
      <audio
        ref={audioRef}
        src={currentBGM?.src}
        onEnded={handleEnded}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />

      {/* 收缩状态：圆形按钮 */}
      <div
        className={`${styles.toggleButton} ${isExpanded ? styles.hidden : ''} ${isPlaying ? styles.playing : ''}`}
        onClick={handleToggle}
        title="BGM 播放器"
      >
        <CustomerServiceOutlined className={styles.icon} />
      </div>

      {/* 展开状态：控制面板 */}
      <div
        className={`${styles.panel} ${isExpanded ? styles.expanded : ''}`}
        onMouseMove={handlePanelInteraction}
        onClick={handlePanelInteraction}
      >
        {/* 歌曲名称 */}
        <div className={styles.trackName}>
          <CustomerServiceOutlined className={styles.trackIcon} />
          <span className={styles.trackText}>{currentBGM?.name || '未选择'}</span>
        </div>

        {/* 播放控制 */}
        <div className={styles.controls}>
          <button className={styles.controlBtn} onClick={handlePrev} title="上一首">
            <StepBackwardOutlined />
          </button>
          <button className={styles.controlBtn} onClick={handlePlayPause} title={isPlaying ? '暂停' : '播放'}>
            {isPlaying ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
          </button>
          <button className={styles.controlBtn} onClick={handleNext} title="下一首">
            <StepForwardOutlined />
          </button>
          <Tooltip title={currentModeConfig.label}>
            <button
              className={`${styles.controlBtn} ${styles.modeBtn}`}
              onClick={handleModeChange}
            >
              {currentModeConfig.icon}
            </button>
          </Tooltip>
        </div>

        {/* 音量控制 */}
        <div className={styles.volumeControl}>
          <SoundOutlined className={styles.volumeIcon} />
          <Slider
            className={styles.volumeSlider}
            min={0}
            max={100}
            value={volume}
            onChange={handleVolumeChange}
            tooltip={{ formatter: (value) => `${value}%` }}
          />
        </div>

        {/* 收起按钮 */}
        <div className={styles.closeBtn} onClick={handleToggle}>
          ×
        </div>
      </div>
    </div>
  )
}