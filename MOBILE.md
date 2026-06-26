# 打包成 Android App（Capacitor）

把现有 Next.js 前端打包成原生 Android `.apk`，桌面图标点开即用，**不再每次输网址**。
后端（4 个 API 路由）继续部署在 Vercel，App 通过网络调用。

## 架构

```
打开 App          → 不需要网（前端界面打进 APK，本地加载）
用 AI / 存数据    → 需要网（后端在 Vercel）
没网时            → 界面照常，AI 调用走项目原有 Mock 兜底
```

- **前端**：`BUILD_TARGET=capacitor` 时 Next.js 静态导出到 `out/`，由 `cap sync` 打进 APK。
- **后端**：`app/api/*` 不进 APK，留在 Vercel。App 内 WebView 源是 `https://localhost`，
  通过构建时注入的 `NEXT_PUBLIC_API_BASE`（默认 `https://pocket-master-pi.vercel.app`）
  指向线上后端。见 `lib/apiBase.ts`。
- **跨域**：`middleware.ts` 给 `/api/*` 统一加 CORS 头，使 App 能跨源调用 Vercel。
- 静态导出与服务端代码（`app/api`、`middleware.ts`）冲突，`scripts/build-mobile.mjs`
  在导出期间临时挪走它们、完成后还原。**对 Vercel 部署零影响**（默认 `next build` 不变）。

## 出包方式一：GitHub Actions 云端构建（无需本地装 Android 环境）

1. 提交并推送代码到 GitHub：
   ```bash
   git add -A && git commit -m "feat: Capacitor 打包 Android App" && git push
   ```
2. 打开仓库 **Actions** → **Build Android APK** → **Run workflow**（手动触发）；
   或推送一个 tag 自动触发：`git tag v1.0.0 && git push --tags`。
3. 跑完后在该次运行页面底部 **Artifacts** 下载 `pocket-master-debug-apk`，解压得到 `app-debug.apk`。

## 出包方式二：本地构建（需 Android Studio / JDK 21 + SDK 36）

```bash
npm run build:mobile          # 静态导出 + cap sync
cd android && ./gradlew assembleDebug
# 产物：android/app/build/outputs/apk/debug/app-debug.apk
```
或 `npx cap open android` 在 Android Studio 里点运行/打包。

## 装到手机

1. 把 `app-debug.apk` 传到安卓手机（微信文件助手 / 数据线 / 网盘均可）。
2. 点开安装；首次需在系统设置里允许「安装未知来源应用」。
3. 桌面出现「随身小当家」图标，点开即用。

> 这是 **debug 包**（用调试签名），适合自己装来用 / 演示。
> 上架应用商店需要 release 签名，另配 keystore，本项目暂未做。

## 改了前端代码后

重新出包即可（CI 重跑，或本地 `npm run build:mobile` 再 gradle）。
改了后端（`app/api`）只需照常部署 Vercel，App 不用重新打包。
