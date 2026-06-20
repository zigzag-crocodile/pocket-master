import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '随身小当家 · My Pocket Master',
  description: '你的口袋 AI 助手 — Main Agent 调度 Sub Agent 处理日程、会议、总结等碎片事务',
  applicationName: '随身小当家',
  icons: { icon: '/logo.webp', shortcut: '/logo.webp', apple: '/logo.webp' },
  appleWebApp: { capable: true, title: '随身小当家', statusBarStyle: 'default' },
  formatDetection: { telephone: false },
}

export const viewport: Viewport = {
  themeColor: '#7d9c57',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  )
}
