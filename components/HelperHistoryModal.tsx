'use client'
import { useEffect, useState } from 'react'
import { loadHelperHistory, HelperHistoryItem } from '@/lib/db'
import { isSupabaseConfigured } from '@/lib/supabase'

interface Props {
  helperId: string
  helperName: string
  onClose: () => void
}

const STATUS_STYLE: Record<string, { label: string; color: string; bg: string }> = {
  completed: { label: '完成', color: '#6fae5a', bg: '#e9f3e2' },
  mock: { label: 'Mock', color: '#b59a6a', bg: '#f4eede' },
  failed: { label: '失败', color: '#e07a6a', bg: '#fbeae6' },
}

export default function HelperHistoryModal({ helperId, helperName, onClose }: Props) {
  const [items, setItems] = useState<HelperHistoryItem[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)
  const supaOn = isSupabaseConfigured()

  useEffect(() => {
    let active = true
    ;(async () => {
      const data = await loadHelperHistory(helperId)
      if (active) {
        setItems(data)
        setLoading(false)
      }
    })()
    return () => { active = false }
  }, [helperId])

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 sm:p-5" style={{ background: 'rgba(53,56,47,0.32)', backdropFilter: 'blur(3px)' }} onClick={onClose}>
      <div
        className="w-full max-w-md bg-card rounded-3xl shadow-lift pop-in"
        style={{ maxHeight: '88vh', display: 'flex', flexDirection: 'column' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div className="min-w-0">
            <div className="text-[16px] font-semibold text-ink">{helperName}</div>
            <div className="text-[12.5px] text-sub mt-0.5">历史工作记录</div>
          </div>
          <button onClick={onClose} className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full text-faint hover:text-sub hover:bg-canvas transition-colors">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 pb-5">
          {loading ? (
            <div className="text-sub text-[13px] text-center py-10">载入中…</div>
          ) : !supaOn ? (
            <div className="text-sub text-[13px] text-center py-10 leading-relaxed">
              当前为 demo 模式（未接 Supabase），历史记录不会持久化。<br />登录真实账号后，这里会显示该小帮手的每次调用记录。
            </div>
          ) : !items || items.length === 0 ? (
            <div className="text-sub text-[13px] text-center py-10">这个小帮手还没有工作记录。<br />去输入框派个任务试试吧。</div>
          ) : (
            <div className="space-y-2.5">
              {items.map((it) => {
                const st = STATUS_STYLE[it.status] || STATUS_STYLE.completed
                const open = expanded === it.id
                return (
                  <div key={it.id} className="rounded-2xl border border-hairline overflow-hidden">
                    <button className="w-full text-left px-3.5 py-3" onClick={() => setExpanded(open ? null : it.id)}>
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-[11.5px] text-faint">{new Date(it.created_at).toLocaleString('zh-CN')}</span>
                        <span className="shrink-0 text-[11px] px-2 py-0.5 rounded-full font-medium" style={{ color: st.color, background: st.bg }}>{st.label}</span>
                      </div>
                      <div className="text-[13px] text-ink line-clamp-2">{it.input || '（无输入文本）'}</div>
                      {it.routeChain?.length > 0 && (
                        <div className="text-[11px] text-faint mt-1 truncate">{it.routeChain.join(' → ')}</div>
                      )}
                    </button>
                    {open && (
                      <div className="px-3.5 pb-3 border-t border-hairline pt-2.5">
                        <div className="text-[11.5px] text-sub mb-1">输出</div>
                        <pre className="text-[12px] text-ink whitespace-pre-wrap leading-relaxed max-h-52 overflow-y-auto" style={{ fontFamily: 'inherit' }}>
                          {it.output || '（无输出）'}
                        </pre>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
