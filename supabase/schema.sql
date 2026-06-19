-- ============================================================
-- 随身小当家 · Supabase 建表脚本
-- 用法：Supabase 控制台 → SQL Editor → 新建 query → 全文粘贴 → Run
-- 所有表都开启了行级安全(RLS)，每个用户只能读写自己的数据。
-- 登录用 Supabase 自带的 auth.users，无需单独建 users 表。
-- ============================================================

-- 已安装的小帮手（每用户一份）
create table if not exists public.subagents (
  id text not null,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  description text,
  category text,
  status text default 'untested',           -- untested/testing/passed/enabled/disabled/error
  is_enabled boolean default false,
  required_permissions text[] default '{}',
  configs jsonb default '{}'::jsonb,         -- AGENTS/IDENTITY/SOUL/MEMORY/SKILLS/TOOLS 内容
  last_test_result jsonb,
  last_called_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  primary key (user_id, id)
);

-- 任务
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text,                                -- 历史记录标题（自动生成，可编辑）
  input_text text,
  output_text text,
  output_type text,                          -- markdown/json/prompt
  task_type text,
  status text,                               -- completed/failed/mock
  created_at timestamptz default now()
);
-- 已有项目补列：alter table public.tasks add column if not exists title text;

-- 调度运行记录
create table if not exists public.agent_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  task_id uuid references public.tasks(id) on delete cascade,
  main_agent_status text,
  route_chain text[],
  called_subagents text[],
  model_used text,
  is_mock boolean default false,
  latency_ms int,
  success boolean,
  error_message text,
  created_at timestamptz default now()
);

-- 修理室日志
create table if not exists public.repair_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  run_id uuid references public.agent_runs(id) on delete set null,
  issue_type text,                           -- routing_error/config_error/model_error
  issue_type_text text,
  diagnosis text,
  suggestion text,
  fixed boolean default false,
  fixed_config_preview text,
  created_at timestamptz default now()
);

-- 导出日志
create table if not exists public.export_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  task_id uuid references public.tasks(id) on delete cascade,
  export_type text,                          -- markdown/json/copy
  created_at timestamptz default now()
);

-- 待办 / 日程
create table if not exists public.todos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null,
  due_date date,
  due_time text,                             -- 'HH:MM'，可空
  location text,
  notes text,
  done boolean default false,
  source text default 'manual',              -- manual / schedule-helper
  created_at timestamptz default now()
);

-- ============ 行级安全 (RLS) ============
alter table public.subagents   enable row level security;
alter table public.tasks       enable row level security;
alter table public.agent_runs  enable row level security;
alter table public.repair_logs enable row level security;
alter table public.export_logs enable row level security;
alter table public.todos       enable row level security;

-- 每个表：用户只能操作自己的行（user_id = 当前登录用户）
do $$
declare t text;
begin
  foreach t in array array['subagents','tasks','agent_runs','repair_logs','export_logs','todos']
  loop
    execute format('drop policy if exists "own_select" on public.%I;', t);
    execute format('drop policy if exists "own_insert" on public.%I;', t);
    execute format('drop policy if exists "own_update" on public.%I;', t);
    execute format('drop policy if exists "own_delete" on public.%I;', t);
    execute format('create policy "own_select" on public.%I for select using (auth.uid() = user_id);', t);
    execute format('create policy "own_insert" on public.%I for insert with check (auth.uid() = user_id);', t);
    execute format('create policy "own_update" on public.%I for update using (auth.uid() = user_id);', t);
    execute format('create policy "own_delete" on public.%I for delete using (auth.uid() = user_id);', t);
  end loop;
end $$;

-- 常用索引
create index if not exists idx_tasks_user_created on public.tasks(user_id, created_at desc);
create index if not exists idx_runs_user_created on public.agent_runs(user_id, created_at desc);
create index if not exists idx_repair_user_created on public.repair_logs(user_id, created_at desc);
create index if not exists idx_todos_user_due on public.todos(user_id, due_date);
