# 随身小当家 · 项目快照（2026-06-20）

> 给"换会话/换人接手"用的状态备份。不含密钥（密钥在本地 `.env.local`）。

## 一句话
移动端 AI Agent 助手：Main Agent（小当家）调度 Sub Agent（小帮手）处理日程/会议/总结等碎片事务，真实 LLM + 真实登录 + 数据持久化，已上线。

## 线上 / 仓库 / 账号
- 线上：https://pocket-master-pi.vercel.app/
- 仓库：https://github.com/zigzag-crocodile/pocket-master （分支 main）
- 演示账号：`demo@pocketmaster.app` / `pocket2026`（已确认邮箱）
- Supabase 项目 ref：`njklurfgxaskgsdvmhgv`

## 技术栈
Next.js 14（App Router）+ TypeScript + Tailwind CSS；Supabase（Auth + Postgres + RLS）；DeepSeek（OpenAI 兼容文本，function calling）；Groq Whisper（语音转写）；Vercel 部署。已加 PWA（可加到主屏幕）。

## 环境变量（值在 `.env.local` / Vercel，勿外传）
- `LLM_API_KEY` / `LLM_MODEL`(deepseek-chat) / `LLM_BASE_URL`(https://api.deepseek.com)
- `STT_API_KEY` / `STT_MODEL`(whisper-large-v3-turbo) / `STT_BASE_URL`(https://api.groq.com/openai/v1)；本地可选 `STT_PROXY`（Vercel 不要设）
- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`(sb_publishable_…) / `SUPABASE_SERVICE_ROLE_KEY`(sb_secret_…)
- 可选：`SEARCH_API_KEY`(Tavily) 启用联网搜索工具

## 核心实现
- `app/api/agent/route.ts`：function-calling agent 循环。模型调 `route` 工具选 Sub Agent，按需调 `get_current_datetime` / `create_calendar_event(.ics)` / `web_search`(需 key)。无 key/失败回退关键词路由 + Mock。`lib/agentTools.ts` 是工具定义/执行。
- `app/api/transcribe/route.ts`：Groq Whisper 转写（undici 转发，支持代理）。
- `lib/db.ts`：Supabase 数据层（subagents/tasks/agent_runs/repair_logs/export_logs/todos；历史/小账本/最近活动/待办 CRUD）。
- 人物：`components/CharacterAvatar.tsx` 按状态加载 `/public/mascot/{state}.png`，缺图回退 SVG `Mascot.tsx`。顶栏 logo `components/Logo.tsx` 加载 `/public/logo.(webp|png)`。
- 视觉：白底 + 浅绿重点色（输入框/开关/Tab）；小当家居中放大 + 状态文字。

## 数据库（Supabase SQL Editor 跑 `supabase/schema.sql`）
6 表全开 RLS。若是旧库补两列/表：
```sql
alter table public.tasks add column if not exists title text;
-- todos 表见 schema.sql
```

## 已完成
登录(Supabase)/持久化/真路由+真工具/多模态输入(文本/文件/录音实时转写)/内置日程(日历+待办+一键写入.ics)/帮手集市(安装/详情配置)/我的小帮手(滑动开关/历史记录可改标题)/修理室(小诊所+当家账本，含最近活动)/敏感授权+脱敏小账本/导出(复制+md)/PWA。

## 待办 / 下一步
- 图片 OCR / 视觉识别：需视觉模型 key（建议智谱 GLM-4V-Flash 免费 / 通义 qwen-vl）。
- 联网搜索：给 `SEARCH_API_KEY`(Tavily 免费) 即启用（工具已就绪）。
- HBuilderX 打 APK（Wap2App 包 Vercel 网址）。
- 安全：DeepSeek/Groq/Supabase 密钥曾在对话出现，建议各平台轮换后更新 Vercel 变量重部署。

## 本地运行
`npm install` → 填 `.env.local`（可全空跑 Mock+demo）→ `npm run dev` → localhost:3000。
改完默认：`tsc --noEmit` + `npm run build` 验证 → push（Vercel 自动部署）。
