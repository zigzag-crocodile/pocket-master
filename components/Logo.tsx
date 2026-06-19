'use client'
import { useState, useEffect } from 'react'

const CANDIDATES = ['/logo.webp', '/logo.png']

// 产品 logo：优先加载 /public/logo.(webp|png)；取不到则回退到绿色渐变图标
export default function Logo({ size = 28 }: { size?: number }) {
  const [src, setSrc] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    let i = 0
    const tryNext = () => {
      if (!active || i >= CANDIDATES.length) { if (active) setSrc(null); return }
      const url = CANDIDATES[i++]
      const img = new window.Image()
      img.onload = () => { if (active) setSrc(url) }
      img.onerror = tryNext
      img.src = url
    }
    tryNext()
    return () => { active = false }
  }, [])

  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} width={size} height={size} alt="随身小当家" className="rounded-xl object-cover" style={{ width: size, height: size }} />
  }
  return (
    <span className="flex items-center justify-center rounded-xl text-white" style={{ width: size, height: size, background: 'linear-gradient(135deg,#94b56a,#6b8a48)', fontSize: size * 0.5 }}>
      🌱
    </span>
  )
}
