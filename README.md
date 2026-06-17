# My Pocket Master（随身小当家）

轻量化移动端 AI Agent 助手。通过「小当家 + 小帮手」处理日程、会议、总结、图文 Prompt、资讯提醒等碎片化事务。

> 接入 **DeepSeek 等 OpenAI 兼容文本模型**做真实回答；接 **Supabase** 做真实登录与数据持久化。
> 未配置模型 key 时**自动进入 Mock 模式**并在前端明确标识（不伪装成真实 API 结果）；未配置 Supabase 时登录走 demo、数据存内存。

## 技术栈

Next.js 14 (App Router) · TypeScript · Tailwind CSS · Supabase（Auth + Postgres）· DeepSeek（OpenAI 兼容，可换模型）· Vercel

## 本地运行

```bash
npm install
cp .env.example .env.local   # Windows: copy .env.example .env.local
# 按需在 .env.local 填模型 key 和 Supabase 密钥（都留空也能跑 Mock + demo）
npm run dev
```

打开 http://localhost:3000 。配了 Supabase 用真实邮箱注册/登录；没配则任意邮箱 demo 登录。
**不配置任何环境变量也能跑通完整闭环**——AI 走 Mock、数据存内存。

## 环境变量

| 变量 | 说明 |
|---|---|
| `LLM_API_KEY` | 模型 API Key。**留空即进入 Mock 模式** |
| `LLM_MODEL` | 模型名，默认 `deepseek-chat` |
| `LLM_BASE_URL` | OpenAI 兼容地址，默认 `https://api.deepseek.com` |
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase 登录 + 客户端读写（留空走 demo + 内存态） |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase 服务端密钥（仅后端使用） |

换模型只改这三项即可（示例见 `.env.example`）：DeepSeek / Kimi / 智谱 GLM / 通义千问 / Doubao。
模型 Key 只在后端 `app/api/agent/route.ts` 使用，前端不暴露。

## 闭环

```
注册/登录 → 输入任务 → 小当家理解/调度 → 小帮手用真实模型输出 Markdown
        → 敏感信息弹权限确认 → 导出(.md/.json/复制)
        → 模型未配/失败自动 Mock → 修理室记录 → 小诊所诊断 → 当家账本（真实数据计算）
```

已验证场景：
- **会议任务** → 会议小帮手 → 主题/结论/行动项表格
- **面试表达** → 内容总结小帮手 →「我在面试中可以这样讲」
- **日程任务** → 触发「私人日程」权限弹窗 → 日程小帮手（声明不写入系统日历）
- **模型未配置** → Mock 模式提示 + 修理室新增模型失败记录
- **数据持久化** → 任务/小帮手状态存 Supabase，刷新与换设备同账号仍在

## 第一版边界

不做：真实日历写入 / 真实图片识别 OCR / 图像生成 / 用户自建小帮手 / PDF 导出 / 联网资讯抓取。图文识别小帮手只生成 Prompt。

## 部署

见 [DEPLOYMENT.md](DEPLOYMENT.md)。数据库建表脚本见 [supabase/schema.sql](supabase/schema.sql)，表结构说明见 [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md)。

## 目录

```
app/
  api/agent/route.ts   小当家调度 + 模型调用(DeepSeek 等) + Mock 兜底 + 敏感检测
  page.tsx             登录页（Supabase Auth / demo 回退）
  layout.tsx / globals.css
components/             AgentStatusPanel / MainInputBox / MyHelpersPanel / MarketplacePanel /
                       RepairRoom / OutputPanel / PermissionModal / HelperCard /
                       HelperDetailModal / Dashboard / Mascot / CharacterAvatar
lib/                   routing(任务分类+敏感检测) / mock_responses / export /
                       supabase(客户端) / db(Supabase 数据层)
data/mock_data.ts      帮手集市 / 默认小帮手 / 配置文件 / Mock 兜底数据
public/mascot/         小当家各状态人物图（命名见该目录 README）
supabase/schema.sql    建表 + 行级安全(RLS)
```
