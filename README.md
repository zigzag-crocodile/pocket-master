# My Pocket Master（随身小当家）

轻量化移动端 AI Agent 助手。通过「小当家 + 小帮手」处理日程、会议、总结、图文 Prompt、资讯提醒等碎片化事务。

> 第一版 MVP。仅文字输入；接入 Doubao Seed 2.0 Lite 文本模型；**未配置 / 失败 / 超时时自动进入 Mock 模式**，并在前端明确标识（不伪装成真实 API 结果）。

## 技术栈

Next.js 14 (App Router) · TypeScript · Tailwind CSS · Supabase（可选）· Doubao Seed 2.0 Lite · Vercel

## 本地运行

```bash
npm install
cp .env.example .env.local   # Windows: copy .env.example .env.local
npm run dev
```

打开 http://localhost:3000 ，任意邮箱即可登录（Demo 登录）。

**不配置任何环境变量也能跑通完整演示闭环**——会全程走 Mock 模式。

## 环境变量

| 变量 | 说明 |
|---|---|
| `DOUBAO_API_KEY` | 火山方舟 API Key。**留空即进入 Mock 模式** |
| `DOUBAO_MODEL` | 默认 `doubao-seed-2.0-lite` |
| `DOUBAO_BASE_URL` | 默认火山方舟地址 |
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY` | Supabase 持久化（可选，未配置时仅前端内存态） |

API Key 只在后端 `app/api/agent/route.ts` 使用，前端不暴露。

## 演示闭环

```
登录 → 输入任务 → 小当家理解/调度 → 小帮手输出 Markdown
     → 敏感信息弹权限确认 → 导出(.md/.json/复制)
     → API失败自动 Mock → 修理室记录 → 小诊所诊断 → 当家账本指标
```

已验证场景：
- **会议任务** → 会议小帮手 → 主题/结论/行动项表格
- **面试表达** → 内容总结小帮手 →「我在面试中可以这样讲」
- **日程任务** → 触发「私人日程」权限弹窗 → 日程小帮手（声明不写入系统日历）
- **API 失败** → Mock 模式提示 + 修理室新增模型失败记录

## 第一版边界

不做：真实日历写入 / 真实图片识别 OCR / 图像生成 / 多设备同步 / 用户自建小帮手 / PDF 导出 / 联网资讯抓取。图文识别小帮手只生成 Prompt。

## 部署

见 [DEPLOYMENT.md](DEPLOYMENT.md)。数据库表结构见 [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md)。

## 目录

```
app/
  api/agent/route.ts   小当家调度 + Doubao 调用 + Mock 兜底 + 敏感检测
  page.tsx             登录页
  layout.tsx / globals.css
components/             AgentStatusPanel / MainInputBox / MyHelpersPanel /
                       MarketplacePanel / RepairRoom / OutputPanel /
                       PermissionModal / HelperCard / HelperDetailModal / Dashboard
lib/                   routing(任务分类+敏感检测) / mock_responses / export / supabase
data/mock_data.ts      帮手集市 / 已装小帮手 / 配置文件 / 修理日志 / 账本指标
```
