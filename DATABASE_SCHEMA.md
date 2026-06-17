# 数据库表结构（Supabase）

第一版可不配 Supabase（前端内存态即可跑通）。接入持久化时按下表建表。

```sql
-- 用户
create table users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  created_at timestamptz default now()
);

-- 小帮手
create table subagents (
  id text primary key,
  user_id uuid references users(id),
  name text not null,
  description text,
  category text,
  status text default 'untested',          -- untested/testing/passed/enabled/disabled/error
  is_enabled boolean default false,
  required_permissions text[] default '{}',
  config_agents_md text,
  config_identity_md text,
  config_soul_md text,
  config_memory_md text,
  config_skills_md text,
  config_tools_md text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 任务
create table tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id),
  input_text text,
  output_text text,
  output_type text,                         -- markdown/json/prompt
  status text,                              -- completed/failed/mock
  created_at timestamptz default now()
);

-- 调度运行记录
create table agent_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id),
  task_id uuid references tasks(id),
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
create table repair_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id),
  run_id uuid references agent_runs(id),
  issue_type text,                          -- routing_error/config_error/model_error
  diagnosis text,
  suggestion text,
  fixed boolean default false,
  created_at timestamptz default now()
);

-- 导出日志
create table export_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id),
  task_id uuid references tasks(id),
  export_type text,                         -- markdown/json/copy
  created_at timestamptz default now()
);
```

> 隐私规则：用户选「不允许存储」时不写 `tasks.input_text`；`repair_logs` 不记录原文，只记录风险类型。
