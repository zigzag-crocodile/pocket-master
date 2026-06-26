/** @type {import('next').NextConfig} */
// BUILD_TARGET=capacitor 时导出纯静态前端（打进 APK）；否则保持默认（Vercel 全功能含 API）。
const isCapacitor = process.env.BUILD_TARGET === 'capacitor'

const nextConfig = isCapacitor
  ? {
      output: 'export',
      images: { unoptimized: true },
      trailingSlash: true,
    }
  : {}

module.exports = nextConfig
