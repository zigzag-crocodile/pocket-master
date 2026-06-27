'use client'
import type { ConversationHistoryItem } from '@/lib/db'

interface Props {
  open: boolean
  items: ConversationHistoryItem[]
  loading?: boolean
  onClose: () => void
}

const STATUS_STYLE: Record<string, { label: string; color: string; bg: string }> = {
  completed: { label: '完成', color: '#6fae5a', bg: '#e9f3e2' },
  mock: { label: 'Mock', color: '#b59a6a', bg: '#f4eede' },
  failed: { label: '失败', color: '#e07a6a', bg: '#fbeae6' },
}

export default function ConversationSidebar({ open, items, loading, onClose }: Props) {
  return (
    <div className={`fixed inset-0 z-40 transition ${open ? 'pointer-events-auto' : 'pointer-events-none'}`}>
      <button
        aria-label="关闭历史记录"
        onClick={onClose}
        className={`absolute inset-0 transition-opacity ${open ? 'opacity-100' : 'opacity-0'}`}
        style={{ background: 'rgba(53,56,47,0.28)', backdropFilter: open ? 'blur(2px)' : 'none' }}
      />
      <aside
        className={`absolute left-0 top-0 h-full w-[84vw] max-w-[340px] bg-white shadow-lift transition-transform duration-200 ${open ? 'translate-x-0' : '-translate-x-full'}`}
        style={{ display: 'flex', flexDirection: 'column' }}
      >
        <div className="flex items-center justify-between px-4 py-4 border-b border-hairline">
          <div>
            <div className="text-[16px] font-semibold text-ink">对话记录</div>
            <div className="text-[12px] text-sub mt-0.5">最近的小当家任务</div>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full text-faint hover:text-sub hover:bg-canvas transition-colors" aria-label="关闭">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-3">
          {loading ? (
            <div className="text-[13px] text-sub text-center py-10">载入中…</div>
          ) : items.length === 0 ? (
            <div className="text-[13px] text-sub text-center py-10 leading-relaxed">还没有对话记录。<br />发起一次任务后会出现在这里。</div>
          ) : (
            <div className="space-y-2">
              {items.map((item) => {
                const st = STATUS_STYLE[item.isMock ? 'mock' : item.status] || STATUS_STYLE.completed
                return (
                  <details key={item.id} className="group rounded-2xl border border-hairline bg-card overflow-hidden">
                    <summary className="list-none cursor-pointer px-3 py-3">
                      <div className="flex items-start gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="text-[13.5px] font-medium text-ink truncate">{item.title}</div>
                          <div className="text-[11px] text-faint mt-1">{new Date(item.created_at).toLocaleString('zh-CN')}</div>
                        </div>
                        <span className="shrink-0 text-[10.5px] px-1.5 py-0.5 rounded-full font-medium" style={{ color: st.color, background: st.bg }}>
                          {st.label}
                        </span>
                      </div>
                    </summary>
                    <div className="px-3 pb-3 border-t border-hairline pt-2.5 space-y-2">
                      <div>
                        <div className="text-[11.5px] text-sub mb-1">输入</div>
                        <div className="text-[12.5px] text-ink whitespace-pre-wrap leading-relaxed max-h-24 overflow-y-auto">{item.input || '（无输入）'}</div>
                      </div>
                      <div>
                        <div className="text-[11.5px] text-sub mb-1">输出</div>
                        <pre className="text-[12px] text-ink whitespace-pre-wrap leading-relaxed max-h-44 overflow-y-auto" style={{ fontFamily: 'inherit' }}>{item.output || '（无输出）'}</pre>
                      </div>
                    </div>
                  </details>
                )
              })}
            </div>
          )}
        </div>
      </aside>
    </div>
  )
}
