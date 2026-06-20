import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, isAdminEmail, adminConfigured } from '@/lib/supabaseAdmin'

function title(input: string, output: string): string {
  const src = (input || output || '').replace(/[#>*`|_]/g, '').replace(/\s+/g, ' ').trim()
  if (!src) return '未命名任务'
  return src.slice(0, 18) + (src.length > 18 ? '…' : '')
}

async function cnt(table: string, filters?: Record<string, any>): Promise<number> {
  let q = supabaseAdmin!.from(table).select('*', { count: 'exact', head: true })
  if (filters) for (const [k, v] of Object.entries(filters)) q = q.eq(k, v)
  const { count } = await q
  return count || 0
}

export async function GET(req: NextRequest) {
  if (!supabaseAdmin) return NextResponse.json({ error: '服务端未配置 Supabase（缺 SUPABASE_SERVICE_ROLE_KEY）' }, { status: 500 })
  if (!adminConfigured) return NextResponse.json({ error: '未配置管理员邮箱（请在环境变量设置 ADMIN_EMAIL）' }, { status: 500 })

  // 校验请求者是管理员
  const token = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  if (!token) return NextResponse.json({ error: '未登录' }, { status: 401 })
  const { data: u } = await supabaseAdmin.auth.getUser(token)
  if (!isAdminEmail(u.user?.email)) return NextResponse.json({ error: '无权限（非管理员账号）' }, { status: 403 })

  try {
    const [usersRes, totalTasks, completed, failed, mockRuns, totalRuns, totalTodos, taskUserRows, recentRows] = await Promise.all([
      supabaseAdmin.auth.admin.listUsers({ perPage: 1000 }),
      cnt('tasks'),
      cnt('tasks', { status: 'completed' }),
      cnt('tasks', { status: 'failed' }),
      cnt('agent_runs', { is_mock: true }),
      cnt('agent_runs'),
      cnt('todos'),
      supabaseAdmin.from('tasks').select('user_id').limit(5000),
      supabaseAdmin
        .from('agent_runs')
        .select('id, created_at, main_agent_status, is_mock, success, tasks(task_type, user_id, input_text, output_text)')
        .order('created_at', { ascending: false })
        .limit(25),
    ])

    const users = usersRes.data?.users || []
    const emailById = new Map(users.map((x: any) => [x.id, x.email]))

    // 每用户任务数
    const perUser = new Map<string, number>()
    for (const r of (taskUserRows.data as any[]) || []) perUser.set(r.user_id, (perUser.get(r.user_id) || 0) + 1)

    const userList = users
      .map((x: any) => ({
        email: x.email,
        created_at: x.created_at,
        last_sign_in_at: x.last_sign_in_at,
        confirmed: !!x.email_confirmed_at,
        taskCount: perUser.get(x.id) || 0,
      }))
      .sort((a, b) => (b.taskCount - a.taskCount) || (new Date(b.created_at).getTime() - new Date(a.created_at).getTime()))

    const recent = ((recentRows.data as any[]) || []).map((r) => ({
      title: title(r.tasks?.input_text || '', r.tasks?.output_text || ''),
      taskType: r.tasks?.task_type || 'unknown',
      status: r.main_agent_status || (r.success ? 'completed' : 'failed'),
      isMock: r.is_mock,
      userEmail: emailById.get(r.tasks?.user_id) || '—',
      created_at: r.created_at,
    }))

    return NextResponse.json({
      users: { total: users.length, list: userList },
      tasks: { total: totalTasks, completed, failed },
      runs: { total: totalRuns, mock: mockRuns, mockRate: totalRuns ? Math.round((mockRuns / totalRuns) * 100) : 0 },
      todos: totalTodos,
      recent,
    })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : '查询失败' }, { status: 500 })
  }
}
