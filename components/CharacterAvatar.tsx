'use client'
import { useState, useEffect } from 'react'
import Mascot, { moodFromStatus } from './Mascot'

// 工程状态 → 图片文件名（用户提供的 9 张状态图放在 /public/mascot/ 下）
const STATUS_IMAGE: Record<string, string> = {
  idle: 'idle',                  // 休息中
  understanding: 'thinking',     // 思考中
  routing: 'routing',            // 调度中
  subagent_running: 'running',   // 执行中
  waiting_permission: 'waiting', // 等待授权
  generating: 'generating',      // 生成结果中
  completed: 'completed',        // 完成
  failed: 'error',               // 失败
  mock_mode: 'mock',             // Mock 模式
}

interface Props {
  status: string
  size?: number
}

/**
 * 小当家人物形象。客户端预检测 /public/mascot/{state}.png 是否存在：
 * 存在 → 显示用户提供的状态图；不存在/加载失败 → 回退到绿色 SVG 占位。
 * 检测期间也显示 SVG，避免出现"破图"图标。
 */
export default function CharacterAvatar({ status, size = 120 }: Props) {
  const file = STATUS_IMAGE[status] || 'idle'
  const src = `/mascot/${file}.png`
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let active = true
    setLoaded(false)
    const img = new window.Image()
    img.onload = () => { if (active) setLoaded(true) }
    img.onerror = () => { if (active) setLoaded(false) }
    img.src = src
    return () => { active = false }
  }, [src])

  if (loaded) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        width={size}
        height={size}
        alt={`小当家 - ${file}`}
        draggable={false}
        style={{ objectFit: 'contain', width: size, height: size, userSelect: 'none' }}
      />
    )
  }

  return <Mascot mood={moodFromStatus(status)} size={size} />
}
