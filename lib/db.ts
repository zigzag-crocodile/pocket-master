import { supabase } from './supabase'
import { mockData, SubAgent, RepairLog, Metric } from '@/data/mock_data'

export type AgentRow = SubAgent & { status: string }

export interface LedgerData {
  summary: { total: number; completed: number; mock: number }
  metrics: Metric[]
}

// 新用户首次登录时，把官方默认 4 个小帮手种入数据库
export function defaultInstalledAgents(): AgentRow[] {
  return mockData.installed_subagents.map((a) => ({ ...a }))
}

async function currentUserId(): Promise<string | null> {
  if (!supabase) return null
  const { data } = await supabase.auth.getUser()
  return data.user?.id ?? null
}

function rowToAgent(r: any): AgentRow {
  return {
    id: r.id,
    name: r.name,
    description: r.description,
    category: r.category,
    status: r.status,
    is_enabled: r.is_enabled,
    required_permissions: r.required_permissions || [],
    configs: r.configs || {},
    last_test_result: r.last_test_result || undefined,
    last_called_at: r.last_called_at || '',
  } as AgentRow
}

function agentToRow(a: AgentRow, userId: string) {
  return {
    id: a.id,
    user_id: userId,
    name: a.name,
    description: a.description,
    category: a.category,
    status: a.status,
    is_enabled: a.is_enabled,
    required_permissions: a.required_permissions || [],
    configs: a.configs || {},
    last_test_result: a.last_test_result || null,
    last_called_at: a.last_called_at || null,
    updated_at: new Date().toISOString(),
  }
}

// 读取当前用户的小帮手；为空则种入默认 4 个
export async function loadSubagents(): Promise<AgentRow[] | null> {
  if (!supabase) return null
  const uid = await currentUserId()
  if (!uid) return null
  const { data, error } = await supabase.from('subagents').select('*').order('created_at', { ascending: true })
  if (error) {
    console.warn('[db] loadSubagents:', error.message)
    return null
  }
  if (!data || data.length === 0) {
    const defaults = defaultInstalledAgents()
    const { error: insErr } = await supabase.from('subagents').insert(defaults.map((d) => agentToRow(d, uid)))
    if (insErr) console.warn('[db] seed subagents:', insErr.message)
    return defaults
  }
  return data.map(rowToAgent)
}

export async function upsertSubagents(agents: AgentRow[]): Promise<void> {
  if (!supabase) return
  const uid = await currentUserId()
  if (!uid) return
  const { error } = await supabase
    .from('subagents')
    .upsert(agents.map((a) => agentToRow(a, uid)), { onConflict: 'user_id,id' })
  if (error) console.warn('[db] upsertSubagents:', error.message)
}

// 记录一次任务 + 调度运行，返回 run_id（用于关联修理记录）
export async function recordRun(params: {
  input: string
  output: string
  outputType: string
  taskType: string
  routeChain: string[]
  calledSubagents: string[]
  modelUsed: string
  isMock: boolean
  success: boolean
  errorMessage: string | null
  latencyMs: number
}): Promise<string | null> {
  if (!supabase) return null
  const status = !params.success ? 'failed' : params.isMock ? 'mock' : 'completed'
  const { data: task, error: tErr } = await supabase
    .from('tasks')
    .insert({ input_text: params.input, output_text: params.output, output_type: params.outputType, task_type: params.taskType, status })
    .select('id')
    .single()
  if (tErr) {
    console.warn('[db] insert task:', tErr.message)
    return null
  }
  const { data: run, error: rErr } = await supabase
    .from('agent_runs')
    .insert({
      task_id: task.id,
      main_agent_status: status,
      route_chain: params.routeChain,
      called_subagents: params.calledSubagents,
      model_used: params.modelUsed,
      is_mock: params.isMock,
      latency_ms: params.latencyMs,
      success: params.success,
      error_message: params.errorMessage,
    })
    .select('id')
    .single()
  if (rErr) {
    console.warn('[db] insert run:', rErr.message)
    return null
  }
  return run.id
}

export async function recordRepair(log: Omit<RepairLog, 'id' | 'user_id' | 'created_at' | 'run_id'> & { run_id?: string | null }): Promise<void> {
  if (!supabase) return
  const { error } = await supabase.from('repair_logs').insert({
    run_id: log.run_id ?? null,
    issue_type: log.issue_type,
    issue_type_text: log.issue_type_text,
    diagnosis: log.diagnosis,
    suggestion: log.suggestion,
    fixed: log.fixed ?? false,
    fixed_config_preview: (log as any).fixed_config_preview ?? null,
  })
  if (error) console.warn('[db] insert repair:', error.message)
}

export async function recordExport(taskType: string, exportType: string): Promise<void> {
  if (!supabase) return
  // 取该用户最近一条任务做关联（demo 级别够用）
  const { data } = await supabase.from('tasks').select('id').order('created_at', { ascending: false }).limit(1)
  const taskId = data?.[0]?.id ?? null
  const { error } = await supabase.from('export_logs').insert({ task_id: taskId, export_type: exportType })
  if (error) console.warn('[db] insert export:', error.message)
}

export async function loadRepairLogs(): Promise<RepairLog[] | null> {
  if (!supabase) return null
  const { data, error } = await supabase.from('repair_logs').select('*').order('created_at', { ascending: false }).limit(50)
  if (error) {
    console.warn('[db] loadRepairLogs:', error.message)
    return null
  }
  return (data || []).map((r: any) => ({
    id: r.id,
    run_id: r.run_id || '',
    issue_type: r.issue_type,
    issue_type_text: r.issue_type_text || r.issue_type,
    diagnosis: r.diagnosis || '',
    suggestion: r.suggestion || '',
    can_auto_fix: false,
    fixed: r.fixed,
    fixed_config_preview: r.fixed_config_preview || undefined,
    created_at: r.created_at,
  }))
}

async function countRows(table: string, filters?: Record<string, any>): Promise<number> {
  if (!supabase) return 0
  let q = supabase.from(table).select('*', { count: 'exact', head: true })
  if (filters) for (const [k, v] of Object.entries(filters)) q = q.eq(k, v)
  const { count } = await q
  return count || 0
}

const pct = (v: number) => `${Math.round(v * 100)}%`

// 从真实数据计算当家账本指标
export async function computeLedger(): Promise<LedgerData | null> {
  if (!supabase) return null
  const [totalRuns, successRuns, mockRuns, realSuccess, routingErrors, repairTotal, repairFixed, installed, enabled, exportRows, totalTasks] =
    await Promise.all([
      countRows('agent_runs'),
      countRows('agent_runs', { success: true }),
      countRows('agent_runs', { is_mock: true }),
      countRows('agent_runs', { is_mock: false, success: true }),
      countRows('repair_logs', { issue_type: 'routing_error' }),
      countRows('repair_logs'),
      countRows('repair_logs', { fixed: true }),
      countRows('subagents'),
      countRows('subagents', { is_enabled: true }),
      countRows('export_logs'),
      countRows('tasks'),
    ])

  const realRuns = Math.max(totalRuns - mockRuns, 0)
  const safe = (num: number, den: number, fallback = 0) => (den > 0 ? num / den : fallback)

  const metrics: Metric[] = [
    { name: '任务完成率', value: safe(successRuns, totalRuns), display: pct(safe(successRuns, totalRuns)), formula: '成功完成任务数 / 总任务数' },
    { name: '调度成功率', value: safe(totalRuns - routingErrors, totalRuns, 1), display: pct(safe(totalRuns - routingErrors, totalRuns, 1)), formula: '用户未反馈调度错误的任务数 / 已调度任务数' },
    { name: '模型调用成功率', value: safe(realSuccess, realRuns), display: pct(safe(realSuccess, realRuns)), formula: '模型成功返回次数 / 模型调用总次数' },
    { name: 'Mock 模式触发率', value: safe(mockRuns, totalRuns), display: pct(safe(mockRuns, totalRuns)), formula: 'Mock 模式任务数 / 总任务数' },
    { name: '小帮手启用率', value: safe(enabled, installed), display: pct(safe(enabled, installed)), formula: '已启用小帮手数 / 已安装小帮手数' },
    { name: '小诊所解决率', value: safe(repairFixed, repairTotal, 1), display: pct(safe(repairFixed, repairTotal, 1)), formula: '已修复问题数 / 进入小诊所的问题数' },
    { name: '导出率', value: safe(exportRows, successRuns), display: pct(safe(exportRows, successRuns)), formula: '发生导出行为的任务数 / 成功完成任务数' },
  ]

  return {
    summary: { total: totalTasks, completed: successRuns, mock: mockRuns },
    metrics,
  }
}

// ============ 待办 / 日程 ============
export interface Todo {
  id: string
  title: string
  due_date: string | null
  due_time: string | null
  location: string | null
  notes: string | null
  done: boolean
  source: string
  created_at: string
}

export async function loadTodos(): Promise<Todo[] | null> {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('todos')
    .select('*')
    .order('due_date', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false })
  if (error) {
    console.warn('[db] loadTodos:', error.message)
    return null
  }
  return (data || []) as Todo[]
}

export async function addTodo(t: Partial<Todo>): Promise<Todo | null> {
  if (!supabase) return null
  const uid = await currentUserId()
  if (!uid) return null
  const { data, error } = await supabase
    .from('todos')
    .insert({
      user_id: uid,
      title: t.title,
      due_date: t.due_date || null,
      due_time: t.due_time || null,
      location: t.location || null,
      notes: t.notes || null,
      done: t.done ?? false,
      source: t.source || 'manual',
    })
    .select('*')
    .single()
  if (error) {
    console.warn('[db] addTodo:', error.message)
    return null
  }
  return data as Todo
}

export async function updateTodo(id: string, patch: Partial<Todo>): Promise<void> {
  if (!supabase) return
  const { error } = await supabase.from('todos').update(patch).eq('id', id)
  if (error) console.warn('[db] updateTodo:', error.message)
}

export async function deleteTodo(id: string): Promise<void> {
  if (!supabase) return
  const { error } = await supabase.from('todos').delete().eq('id', id)
  if (error) console.warn('[db] deleteTodo:', error.message)
}

// ============ 小帮手历史工作记录 ============
export interface HelperHistoryItem {
  id: string
  input: string
  output: string
  created_at: string
  status: string
  isMock: boolean
  routeChain: string[]
}

export async function loadHelperHistory(helperId: string): Promise<HelperHistoryItem[] | null> {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('agent_runs')
    .select('id, created_at, main_agent_status, is_mock, route_chain, success, tasks(input_text, output_text)')
    .contains('called_subagents', [helperId])
    .order('created_at', { ascending: false })
    .limit(30)
  if (error) {
    console.warn('[db] loadHelperHistory:', error.message)
    return null
  }
  return (data || []).map((r: any) => ({
    id: r.id,
    input: r.tasks?.input_text || '',
    output: r.tasks?.output_text || '',
    created_at: r.created_at,
    status: r.main_agent_status || (r.success ? 'completed' : 'failed'),
    isMock: r.is_mock,
    routeChain: r.route_chain || [],
  }))
}

// ============ 小账本（MEMORY.md）脱敏摘要写入 ============
export interface MemoryEntry {
  taskType: string
  summary: string
  time: string
  prefs?: string
}

export async function appendHelperMemory(helperId: string, entry: MemoryEntry): Promise<void> {
  if (!supabase) return
  const { data, error } = await supabase.from('subagents').select('configs').eq('id', helperId).maybeSingle()
  if (error || !data) {
    if (error) console.warn('[db] appendHelperMemory read:', error.message)
    return
  }
  const configs = (data.configs || {}) as Record<string, { frontend_note?: string; content?: string }>
  const mem = configs['MEMORY.md'] || { frontend_note: '这个小帮手的小账本，记录它需要记住的偏好、规则和历史信息。', content: '' }
  const line = `- [${entry.time}]（${entry.taskType}）${entry.summary}${entry.prefs ? ' · 偏好/规则：' + entry.prefs : ''}`
  const marker = '## 小账本记录'
  const parts = (mem.content || '').split(marker)
  const original = (parts[0] || '').trim()
  const existing = (parts[1] || '').split('\n').map((s) => s.trim()).filter(Boolean)
  const updated = [line, ...existing].slice(0, 20)
  mem.content = `${original}\n\n${marker}\n${updated.join('\n')}`.trim()
  configs['MEMORY.md'] = mem
  const { error: upErr } = await supabase.from('subagents').update({ configs, updated_at: new Date().toISOString() }).eq('id', helperId)
  if (upErr) console.warn('[db] appendHelperMemory write:', upErr.message)
}
