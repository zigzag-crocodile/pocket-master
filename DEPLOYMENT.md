# 部署指南（上线到 Vercel）

本项目已可真实运行：AI（DeepSeek / 任意 OpenAI 兼容模型）+ Supabase（登录 + 数据持久化）。
本地 `.env.local` 里的密钥**不会进 Git**（已在 .gitignore 排除），线上密钥要在 Vercel 后台单独填。

## 一、把代码推到 GitHub

代码已在本地 git 提交好（`git log` 可见首个 commit）。你只需：

1. 在 GitHub 新建一个**空仓库**（不要勾 README）：github.com/new，例如 `my-pocket-master`。
2. 在项目目录执行（把 URL 换成你的仓库地址）：
   ```bash
   git remote add origin https://github.com/<你的用户名>/my-pocket-master.git
   git branch -M main
   git push -u origin main
   ```
   推送时按提示登录 GitHub（或用 GitHub Desktop 拖入推送）。

## 二、在 Vercel 导入并部署

1. 打开 vercel.com → 用 GitHub 登录 → **Add New… → Project** → 选刚推的仓库 → Import。
2. Framework 会自动识别为 **Next.js**，无需改构建命令。
3. 展开 **Environment Variables**，逐条添加（值从你本地 `.env.local` 复制）：

   | Name | Value |
   |---|---|
   | `LLM_API_KEY` | 你的 DeepSeek key（`sk-...`） |
   | `LLM_MODEL` | `deepseek-chat` |
   | `LLM_BASE_URL` | `https://api.deepseek.com` |
   | `NEXT_PUBLIC_SUPABASE_URL` | `https://njklurfgxaskgsdvmhgv.supabase.co` |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 你的 `sb_publishable_...` |
   | `SUPABASE_SERVICE_ROLE_KEY` | 你的 `sb_secret_...` |

4. 点 **Deploy**，等 1~2 分钟，得到公网地址 `https://xxx.vercel.app`。

## 三、上线后检查

1. 打开公网地址 → 注册/登录（Supabase 真实账号）。
2. 输入任务 → 应得到 DeepSeek 真实回答（无 Mock 角标）。
3. 刷新 → 仍登录、数据还在 → ✅ 部署成功。

## 备注
- 数据库表：确保已在 Supabase SQL Editor 跑过 `supabase/schema.sql`。
- 邮箱验证：演示期可在 Supabase → Authentication → Email 关闭 "Confirm email"（注册即登录）；正式上线建议打开。
- 换模型：只改 Vercel 里 `LLM_MODEL` / `LLM_BASE_URL` / `LLM_API_KEY` 三个变量即可（DeepSeek / Kimi / 智谱 / 通义 / Doubao），无需改代码。
- 轮换密钥：密钥如曾在聊天/外部出现过，上线后建议在对应平台重新生成一次更安全。
