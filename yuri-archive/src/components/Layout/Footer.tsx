import { Layout } from 'antd'
import { HeartFilled } from '@ant-design/icons'
import styles from './Footer.module.css'

const { Footer: AntFooter } = Layout

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <AntFooter className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.copyright}>
          <span>© {currentYear} 百合文学档案馆</span>
          <span className={styles.divider}>|</span>
          <span>
            Made with <HeartFilled className={styles.heart} /> for Yuri lovers
          </span>
        </div>
        <div className={styles.links}>
          <a href="#about">关于我们</a>
          <a href="#contact">联系方式</a>
          <a href="#terms">使用条款</a>
        </div>
      </div>
    </AntFooter>
  )
}
