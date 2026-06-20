import type { MetadataRoute } from 'next'

// PWA 清单：让网页可「添加到主屏幕」，全屏运行像原生 app
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: '随身小当家 · My Pocket Master',
    short_name: '小当家',
    description: '你的口袋 AI 助手',
    start_url: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#ffffff',
    theme_color: '#7d9c57',
    icons: [
      { src: '/logo.webp', sizes: '192x192', type: 'image/webp', purpose: 'any' },
      { src: '/logo.webp', sizes: '512x512', type: 'image/webp', purpose: 'any' },
    ],
  }
}
