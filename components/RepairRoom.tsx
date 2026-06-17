'use client'
import { useState } from 'react'
import { RepairLog, Metric, mockData } from '@/data/mock_data'

const ISSUE_CONFIG: Record<string, { color: string; bg: string }> = {
  model_error: { color: '#e07a6a', bg: '#fbeae6' },
  routing_error: { color: '#e0a15a', bg: '#faf0e2' },
  config_error: { color: '#969a8c', bg: '#f0f2eb' },
}

interface Props {
  repairLogs: RepairLog[]
  metrics: Metric[]
  summary?: { total: number; completed: number; mock: number }
}

export default function RepairRoom({ repairLogs, metrics, summary }: Props) {
  const [tab, setTab] = useState<'clinic' | 'ledger'>('clinic')

  return (
    <div className="px-4 py-4">
      {/* segmented control */}
      <div className="flex gap-1 p-1 mb-4 bg-card rounded-full shadow-card">
        {([['clinic', '小诊所'], ['ledger', '当家账本']] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className="flex-1 text-[13px] font-medium py-2 rounded-full transition-all"
            style={{
              background: tab === key ? '#7d9c57' : 'transparent',
              color: tab === key ? '#ffffff' : '#969a8c',
              boxShadow: tab === key ? '0 5px 14px rgba(125,156,87,0.25)' : 'none',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'clinic' ? <ClinicPanel repairLogs={repairLogs} /> : <LedgerPanel metrics={metrics} summary={summary} />}
    </div>
  )
}

function ClinicPanel({ repairLogs }: { repairLogs: RepairLog[] }) {
  const [expanded, setExpanded] = useState<string | null>(null)
  const fixedCount = repairLogs.filter((r) => r.fixed).length

  return (
    <div>
      <div className="text-[13px] text-sub mb-3 px-1">
        共 <span className="text-ink font-semibold">{repairLogs.length}</span> 条诊断 · 已修复 <span className="text-good font-semibold">{fixedCount}</span> 条
      </div>
      {repairLogs.length === 0 && (
        <div className="text-sub text-[13px] text-center py-12 bg-card rounded-2xl shadow-card">
          一切正常，暂无需要诊断的问题。
        </div>
      )}
      <div className="space-y-3">
        {repairLogs.map((log) => {
          const cfg = ISSUE_CONFIG[log.issue_type] || ISSUE_CONFIG.config_error
          const open = expanded === log.id
          return (
            <div key={log.id} className="bg-card rounded-2xl shadow-card overflow-hidden">
              <button
                className="w-full flex items-center justify-between px-4 py-3.5 text-left"
                onClick={() => setExpanded(open ? null : log.id)}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="shrink-0 text-[11.5px] px-2.5 py-1 rounded-full font-medium" style={{ color: cfg.color, background: cfg.bg }}>
                    {log.issue_type_text}
                  </span>
                  <span className="text-[12px] text-faint truncate">{log.run_id}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[11.5px] font-medium" style={{ color: log.fixed ? '#6fae5a' : '#969a8c' }}>
                    {log.fixed ? '已修复' : '待处理'}
                  </span>
                  <span className="text-faint text-[11px]" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▾</span>
                </div>
              </button>
              {open && (
                <div className="px-4 pb-4 space-y-3">
                  <Section label="诊断" body={log.diagnosis} />
                  <Section label="修复建议" body={log.suggestion} />
                  {log.fixed_config_preview && (
                    <div>
                      <div className="text-[11.5px] text-sub mb-1.5">配置修复预览</div>
                      <pre className="text-[12px] text-brand-deep whitespace-pre-wrap leading-relaxed rounded-xl p-3" style={{ background: '#f5f8f0', fontFamily: 'inherit' }}>
                        {log.fixed_config_preview}
                      </pre>
                    </div>
                  )}
                  <div className="text-[11px] text-faint">{new Date(log.created_at).toLocaleString('zh-CN')}</div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function Section({ label, body }: { label: string; body: string }) {
  return (
    <div>
      <div className="text-[11.5px] text-sub mb-1">{label}</div>
      <p className="text-[12.5px] text-ink leading-relaxed">{body}</p>
    </div>
  )
}

function LedgerPanel({ metrics, summary: summaryData }: { metrics: Metric[]; summary?: { total: number; completed: number; mock: number } }) {
  const src = summaryData ?? {
    total: mockData.ledger_metrics.total_tasks,
    completed: mockData.ledger_metrics.completed_tasks,
    mock: mockData.ledger_metrics.mock_tasks,
  }

  const summary = [
    { label: '总任务', value: src.total, color: '#34382f' },
    { label: '已完成', value: src.completed, color: '#6fae5a' },
    { label: 'Mock 次数', value: src.mock, color: '#b59a6a' },
  ]

  return (
    <div>
      {/* summary cards */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {summary.map((item) => (
          <div key={item.label} className="bg-card rounded-2xl shadow-card px-2 py-4 text-center">
            <div className="text-[24px] font-bold leading-none" style={{ color: item.color }}>{item.value}</div>
            <div className="text-[11.5px] text-sub mt-1.5">{item.label}</div>
          </div>
        ))}
      </div>

      {/* metrics */}
      <div className="space-y-3">
        {metrics.map((m) => {
          const pct = Math.round(m.value * 100)
          const color = m.value >= 0.8 ? '#6fae5a' : m.value >= 0.5 ? '#7d9c57' : '#e0a15a'
          return (
            <div key={m.name} className="bg-card rounded-2xl shadow-card px-4 py-3.5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[13px] text-ink font-medium">{m.name}</span>
                <span className="text-[14px] font-bold" style={{ color }}>{m.display}</span>
              </div>
              <div className="h-2 w-full rounded-full" style={{ background: '#f0f2eb' }}>
                <div className="h-2 rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color }} />
              </div>
              <div className="text-[11px] text-faint mt-1.5">{m.formula}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
