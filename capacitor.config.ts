import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'app.pocketmaster.mobile',
  appName: '随身小当家',
  // Next.js 静态导出目录（BUILD_TARGET=capacitor 时产出）
  webDir: 'out',
}

export default config
