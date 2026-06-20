'use client'
import { useEffect, useState } from 'react'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'

interface Stats {
  users: { total: number; list: { email: string; created_at: string; last_sign_in_at: string | null; confirmed: boolean; taskCount: number }[] }
  tasks: { total: number; completed: number; failed: number }
  runs: { total: number; mock: number; mockRate: number }
  todos: number
  recent: { title: string; taskType: string; status: string; isMock: boolean; userEmail: string; created_at: string }[]
}

const TASK_LABEL: Record<string, string> = {
  schedule_task: '日程', meeting_task: '会议', summary_task: '总结', vision_prompt_task: '图文', info_reminder_task: '资讯', repair_task: '诊断', unknown: '任务',
}
const ST: Record<string, { label: string; color: string; bg: string }> = {
  completed: { label: '完成', color: '#6fae5a', bg: '#e9f3e2' },
  mock: { label: 'Mock', color: '#b59a6a', bg: '#f4eede' },
  failed: { label: '失败', color: '#e07a6a', bg: '#fbeae6' },
}

export default function AdminPage() {
  const [state, setState] = useState<'loading' | 'no-login' | 'forbidden' | 'error' | 'ok'>('loading')
  const [errMsg, setErrMsg] = useState('')
  const [data, setData] = useState<Stats | null>(null)

  useEffect(() => {
    ;(async () => {
      if (!isSupabaseConfigured() || !supabase) { setState('error'); setErrMsg('未配置 Supabase'); return }
      const { data: s } = await supabase.auth.getSession()
      const token = s.session?.access_token
      if (!token) { setState('no-login'); return }
      const res = await fetch('/api/admin/stats', { headers: { Authorization: `Bearer ${token}` } })
      if (res.status === 403) { setState('forbidden'); return }
      const j = await res.json()
      if (!res.ok) { setState('error'); setErrMsg(j.error || '加载失败'); return }
      setData(j)
      setState('ok')
    })()
  }, [])

  const wrap = (children: React.ReactNode) => (
    <div className="min-h-screen bg-white">
      <div className="max-w-md mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-[18px] font-bold text-ink">管理后台</h1>
          <a href="/" className="text-[13px] text-sub hover:text-ink">← 返回 app</a>
        </div>
        {children}
      </div>
    </div>
  )

  if (state === 'loading') return wrap(<div className="text-sub text-[13px] text-center py-16">载入中…</div>)
  if (state === 'no-login') return wrap(<div className="text-sub text-[13px] text-center py-16 leading-relaxed">请先在 <a href="/" className="text-brand-deep">首页</a> 用管理员账号登录，再访问 /admin。</div>)
  if (state === 'forbidden') return wrap(<div className="text-bad text-[13px] text-center py-16">无权限：当前账号不是管理员。<br />（需在环境变量 ADMIN_EMAIL 配置你的邮箱）</div>)
  if (state === 'error') return wrap(<div className="text-bad text-[13px] text-center py-16">{errMsg}</div>)
  if (!data) return wrap(null)

  const cards = [
    { v: data.users.total, l: '注册用户', c: '#34382f' },
    { v: data.tasks.total, l: '任务总数', c: '#6fae5a' },
    { v: `${data.runs.mockRate}%`, l: 'Mock 率', c: '#b59a6a' },
    { v: data.todos, l: '待办数', c: '#7d9c57' },
  ]

  return wrap(
    <div className="space-y-5">
      {/* 概览 */}
      <div className="grid grid-cols-4 gap-2">
        {cards.map((x) => (
          <div key={x.l} className="bg-card rounded-2xl shadow-card px-1 py-3.5 text-center">
            <div className="text-[20px] font-bold leading-none" style={{ color: x.c }}>{x.v}</div>
            <div className="text-[10.5px] text-sub mt-1.5">{x.l}</div>
          </div>
        ))}
      </div>

      {/* 用户列表 */}
      <div>
        <div className="text-[13px] text-sub mb-2 px-1">注册用户（{data.users.total}）</div>
        <div className="space-y-2">
          {data.users.list.map((u) => (
            <div key={u.email} className="bg-card rounded-2xl shadow-card px-3.5 py-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[13px] text-ink truncate flex-1">{u.email}</span>
                <span className="shrink-0 text-[11px] px-2 py-0.5 rounded-full font-medium" style={{ color: '#6b8a48', background: '#eef4e6' }}>{u.taskCount} 任务</span>
              </div>
              <div className="text-[11px] text-faint mt-1 flex flex-wrap gap-x-3">
                <span>注册 {new Date(u.created_at).toLocaleDateString('zh-CN')}</span>
                <span>最近 {u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleDateString('zh-CN') : '—'}</span>
                {!u.confirmed && <span className="text-warn">未验证</span>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 最近活动 */}
      <div>
        <div className="text-[13px] text-sub mb-2 px-1">最近任务</div>
        {data.recent.length === 0 ? (
          <div className="text-sub text-[13px] text-center py-8 bg-card rounded-2xl shadow-card">还没有任务记录。</div>
        ) : (
          <div className="space-y-2">
            {data.recent.map((r, i) => {
              const st = ST[r.status] || ST.completed
              return (
                <div key={i} className="bg-card rounded-2xl shadow-card px-3.5 py-2.5 flex items-center gap-2">
                  <span className="text-[11px] px-1.5 py-0.5 rounded-full font-medium shrink-0" style={{ color: '#6b8a48', background: '#eef4e6' }}>{TASK_LABEL[r.taskType] || '任务'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-[12.5px] text-ink truncate">{r.title}</div>
                    <div className="text-[10.5px] text-faint truncate">{r.userEmail} · {new Date(r.created_at).toLocaleString('zh-CN')}</div>
                  </div>
                  <span className="shrink-0 text-[10.5px] px-1.5 py-0.5 rounded-full font-medium" style={{ color: st.color, background: st.bg }}>{st.label}</span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
