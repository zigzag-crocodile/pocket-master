// API 调用基址。
// - Web（部署在 Vercel，同源）：空串 → fetch 走相对路径 /api/...
// - 打包进 App（Capacitor 静态导出）：构建时注入 NEXT_PUBLIC_API_BASE = 线上绝对地址。
//   因为 App 内 WebView 从本地 https://localhost 加载页面，相对路径 /api 会指向
//   本地（不存在后端），必须显式指向线上 Vercel 后端。
export const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? ''

export const apiUrl = (path: string) => `${API_BASE}${path}`
