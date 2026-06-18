'use client'
import { useState } from 'react'
import { Todo } from '@/lib/db'

interface Props {
  todos: Todo[]
  onAdd: (t: Partial<Todo>) => void
  onUpdate: (id: string, patch: Partial<Todo>) => void
  onDelete: (id: string) => void
}

const WEEK = ['日', '一', '二', '三', '四', '五', '六']
const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

type FormState = { id?: string; title: string; due_date: string; due_time: string; location: string; notes: string }
const emptyForm = (date: string): FormState => ({ title: '', due_date: date, due_time: '', location: '', notes: '' })

export default function SchedulePanel({ todos, onAdd, onUpdate, onDelete }: Props) {
  const today = new Date()
  const [view, setView] = useState(new Date(today.getFullYear(), today.getMonth(), 1))
  const [selected, setSelected] = useState<string>('all') // 'all' or YYYY-MM-DD
  const [form, setForm] = useState<FormState | null>(null)

  const year = view.getFullYear()
  const month = view.getMonth()
  const firstWeekday = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const datesWithTodo = new Set(todos.filter((t) => t.due_date).map((t) => t.due_date as string))

  const filtered = selected === 'all' ? todos : todos.filter((t) => t.due_date === selected)
  const sorted = [...filtered].sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1
    return (a.due_date || '9999').localeCompare(b.due_date || '9999') || (a.due_time || '').localeCompare(b.due_time || '')
  })

  const submitForm = () => {
    if (!form || !form.title.trim()) return
    const patch = { title: form.title.trim(), due_date: form.due_date || null, due_time: form.due_time || null, location: form.location || null, notes: form.notes || null }
    if (form.id) onUpdate(form.id, patch)
    else onAdd({ ...patch, source: 'manual' })
    setForm(null)
  }

  return (
    <div className="px-4 py-4">
      {/* calendar card */}
      <div className="bg-card rounded-2xl shadow-card p-4 mb-3">
        <div className="flex items-center justify-between mb-3">
          <button onClick={() => setView(new Date(year, month - 1, 1))} className="w-7 h-7 rounded-full text-sub hover:bg-canvas">‹</button>
          <span className="text-[14px] font-semibold text-ink">{year} 年 {month + 1} 月</span>
          <button onClick={() => setView(new Date(year, month + 1, 1))} className="w-7 h-7 rounded-full text-sub hover:bg-canvas">›</button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center">
          {WEEK.map((w) => <div key={w} className="text-[11px] text-faint py-1">{w}</div>)}
          {Array.from({ length: firstWeekday }).map((_, i) => <div key={'e' + i} />)}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1
            const ds = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
            const isToday = ds === ymd(today)
            const isSel = ds === selected
            const has = datesWithTodo.has(ds)
            return (
              <button
                key={day}
                onClick={() => setSelected(isSel ? 'all' : ds)}
                className="relative aspect-square flex items-center justify-center text-[12.5px] rounded-lg transition-colors"
                style={{
                  background: isSel ? '#7d9c57' : isToday ? '#eef4e6' : 'transparent',
                  color: isSel ? '#fff' : isToday ? '#6b8a48' : '#34382f',
                  fontWeight: isToday || isSel ? 600 : 400,
                }}
              >
                {day}
                {has && <span className="absolute bottom-1 w-1 h-1 rounded-full" style={{ background: isSel ? '#fff' : '#7d9c57' }} />}
              </button>
            )
          })}
        </div>
      </div>

      {/* header row */}
      <div className="flex items-center justify-between mb-2 px-1">
        <div className="text-[13px] text-sub">
          {selected === 'all' ? '全部待办' : selected}
          {selected !== 'all' && <button onClick={() => setSelected('all')} className="ml-2 text-brand-deep">显示全部</button>}
        </div>
        <button
          onClick={() => setForm(emptyForm(selected === 'all' ? ymd(today) : selected))}
          className="text-[12.5px] font-medium px-3 py-1.5 rounded-full text-white"
          style={{ background: '#7d9c57', boxShadow: '0 4px 12px rgba(125,156,87,0.28)' }}
        >
          + 新建
        </button>
      </div>

      {/* todo list */}
      {sorted.length === 0 ? (
        <div className="text-sub text-[13px] text-center py-10 bg-card rounded-2xl shadow-card">
          {selected === 'all' ? '还没有待办，点「新建」或让日程小帮手帮你加。' : '这天没有待办。'}
        </div>
      ) : (
        <div className="space-y-2">
          {sorted.map((t) => (
            <div key={t.id} className="bg-card rounded-2xl shadow-card px-3.5 py-3 flex items-start gap-3">
              <button
                onClick={() => onUpdate(t.id, { done: !t.done })}
                className="shrink-0 mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors"
                style={{ borderColor: t.done ? '#6fae5a' : '#c3c7ba', background: t.done ? '#6fae5a' : 'transparent' }}
              >
                {t.done && <span className="text-white text-[11px]">✓</span>}
              </button>
              <div className="flex-1 min-w-0">
                <div className="text-[13.5px] text-ink" style={{ textDecoration: t.done ? 'line-through' : 'none', color: t.done ? '#969a8c' : '#34382f' }}>{t.title}</div>
                <div className="text-[11.5px] text-faint mt-0.5 flex flex-wrap gap-x-2">
                  {t.due_date && <span>📅 {t.due_date}{t.due_time ? ` ${t.due_time}` : ''}</span>}
                  {t.location && <span>📍 {t.location}</span>}
                  {t.source === 'schedule-helper' && <span style={{ color: '#6b8a48' }}>· 来自日程小帮手</span>}
                </div>
                {t.notes && <div className="text-[11.5px] text-sub mt-1">{t.notes}</div>}
              </div>
              <div className="shrink-0 flex flex-col gap-1">
                <button onClick={() => setForm({ id: t.id, title: t.title, due_date: t.due_date || '', due_time: t.due_time || '', location: t.location || '', notes: t.notes || '' })} className="text-[11.5px] text-sub hover:text-ink px-1">编辑</button>
                <button onClick={() => onDelete(t.id)} className="text-[11.5px] text-faint hover:text-bad px-1">删除</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* add/edit form modal */}
      {form && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 sm:p-5" style={{ background: 'rgba(53,56,47,0.32)', backdropFilter: 'blur(3px)' }} onClick={() => setForm(null)}>
          <div className="w-full max-w-sm bg-card rounded-3xl shadow-lift p-5 pop-in" onClick={(e) => e.stopPropagation()}>
            <div className="text-[15px] font-semibold text-ink mb-3">{form.id ? '编辑待办' : '新建待办'}</div>
            <div className="space-y-3">
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="事项标题" className="w-full px-3.5 py-2.5 text-[14px] rounded-2xl bg-canvas text-ink outline-none border-2 border-transparent focus:border-brand placeholder:text-faint" />
              <div className="flex gap-2">
                <input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} className="flex-1 px-3 py-2.5 text-[13px] rounded-2xl bg-canvas text-ink outline-none border-2 border-transparent focus:border-brand" />
                <input type="time" value={form.due_time} onChange={(e) => setForm({ ...form, due_time: e.target.value })} className="w-28 px-3 py-2.5 text-[13px] rounded-2xl bg-canvas text-ink outline-none border-2 border-transparent focus:border-brand" />
              </div>
              <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="地点（可选）" className="w-full px-3.5 py-2.5 text-[13px] rounded-2xl bg-canvas text-ink outline-none border-2 border-transparent focus:border-brand placeholder:text-faint" />
              <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="备注（可选）" rows={2} className="w-full px-3.5 py-2.5 text-[13px] rounded-2xl bg-canvas text-ink outline-none border-2 border-transparent focus:border-brand resize-none placeholder:text-faint" />
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setForm(null)} className="flex-1 py-2.5 text-[13px] font-medium rounded-2xl bg-canvas text-sub">取消</button>
              <button onClick={submitForm} disabled={!form.title.trim()} className="flex-1 py-2.5 text-[13px] font-medium rounded-2xl text-white" style={{ background: form.title.trim() ? '#7d9c57' : '#c3c7ba' }}>保存</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
