// 打 App 用的前端构建脚本（跨平台，Windows 本地 / CI Linux 通用）。
//
// 做三件事：
//   1. 临时把 app/api 和 middleware.ts 挪走 —— 它们是服务端代码，和 Next.js
//      `output: 'export'` 静态导出冲突；后端继续部署在 Vercel，App 通过
//      NEXT_PUBLIC_API_BASE 指向线上。
//   2. 以 BUILD_TARGET=capacitor 跑 next build，产出纯静态前端到 out/。
//   3. 还原挪走的文件，再把 out/ 同步进 android 工程（若已存在）。
import { execSync } from 'node:child_process'
import { existsSync, mkdirSync, renameSync, rmSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const tmp = join(root, '.mobile-build-tmp')

// [项目内路径, 临时存放路径]
const moves = [
  [join(root, 'app', 'api'), join(tmp, 'api')],
  [join(root, 'middleware.ts'), join(tmp, 'middleware.ts')],
]

// App 内调用的线上后端地址，可用环境变量覆盖
const API_BASE = process.env.MOBILE_API_BASE || 'https://pocket-master-pi.vercel.app'

function sideline() {
  if (!existsSync(tmp)) mkdirSync(tmp, { recursive: true })
  for (const [src, dst] of moves) if (existsSync(src)) renameSync(src, dst)
}

function restore() {
  for (const [src, dst] of moves) if (existsSync(dst)) renameSync(dst, src)
  if (existsSync(tmp)) rmSync(tmp, { recursive: true, force: true })
}

try {
  sideline()
  console.log(`[build-mobile] next build (静态导出, API_BASE=${API_BASE})`)
  execSync('npx next build', {
    stdio: 'inherit',
    env: { ...process.env, BUILD_TARGET: 'capacitor', NEXT_PUBLIC_API_BASE: API_BASE },
  })
} finally {
  restore()
}

if (existsSync(join(root, 'android'))) {
  console.log('[build-mobile] cap sync android')
  execSync('npx cap sync android', { stdio: 'inherit' })
} else {
  console.log('[build-mobile] 未发现 android 工程，跳过 cap sync（首次请先运行 npx cap add android）')
}
