import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '随身小当家 · My Pocket Master',
  description: '轻量化移动端 AI Agent 助手',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  )
}
