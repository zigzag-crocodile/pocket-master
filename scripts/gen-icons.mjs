// 从 public/logo.webp 生成 @capacitor/assets 的源图（assets/ 目录）。
// logo 是 1254² 白底的小当家人物，四周有白边 → 先 trim 裁掉白边放大主体，
// 再按用途居中到画布。配合 gen 后对 ic_launcher.xml 的修补（背景铺满）。
import sharp from 'sharp'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { execSync } from 'node:child_process'

const SRC = 'public/logo.webp'
const OUT = 'assets'
mkdirSync(OUT, { recursive: true })

const white = { r: 255, g: 255, b: 255, alpha: 1 }
const transparent = { r: 0, g: 0, b: 0, alpha: 0 }

const canvas = (w, h, bg) =>
  sharp({ create: { width: w, height: h, channels: 4, background: bg } }).png()

// 裁掉白边后的人物，缩放到 box 内（保持比例）
const character = (box) =>
  sharp(SRC).trim({ threshold: 10 }).resize(box, box, { fit: 'inside' }).png().toBuffer()

async function run() {
  // 自适应前景：人物占 ~88%（工具会再 inset 16.7% → 最终约 58%）
  await canvas(1024, 1024, transparent)
    .composite([{ input: await character(900), gravity: 'center' }])
    .toFile(`${OUT}/icon-foreground.png`)

  // 自适应背景：纯白铺满
  await canvas(1024, 1024, white).toFile(`${OUT}/icon-background.png`)

  // 旧版方/圆图标：白底居中人物
  await canvas(1024, 1024, white)
    .composite([{ input: await character(820), gravity: 'center' }])
    .toFile(`${OUT}/icon-only.png`)

  // 启动图：白底居中人物
  const splashChar = await character(760)
  await canvas(2732, 2732, white).composite([{ input: splashChar, gravity: 'center' }]).toFile(`${OUT}/splash.png`)
  await canvas(2732, 2732, white).composite([{ input: splashChar, gravity: 'center' }]).toFile(`${OUT}/splash-dark.png`)

  console.log('[gen-icons] 源图生成完成，调用 capacitor-assets …')
  execSync('npx capacitor-assets generate --android', { stdio: 'inherit' })

  // 修补自适应图标：背景改成铺满白色（capacitor-assets 默认给背景加了 16.7% inset，
  // 会导致圆形遮罩后四角露底）。前景保持 inset 不动。
  const xmls = [
    'android/app/src/main/res/mipmap-anydpi-v26/ic_launcher.xml',
    'android/app/src/main/res/mipmap-anydpi-v26/ic_launcher_round.xml',
  ]
  for (const f of xmls) {
    const patched = readFileSync(f, 'utf8').replace(
      /<background>\s*<inset[^>]*\/>\s*<\/background>/,
      '<background android:drawable="@color/ic_launcher_background" />',
    )
    writeFileSync(f, patched)
  }
  console.log('[gen-icons] 完成（背景已铺满）')
}

run()
