'use client'
import { SubAgent } from '@/data/mock_data'

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  untested: { label: '未测试', color: '#969a8c', bg: '#f0f2eb' },
  testing: { label: '测试中', color: '#e0a15a', bg: '#faf0e2' },
  passed: { label: '测试通过', color: '#6fae5a', bg: '#e9f3e2' },
  enabled: { label: '已启用', color: '#6b8a48', bg: '#eef4e6' },
  disabled: { label: '已停用', color: '#969a8c', bg: '#f0f2eb' },
  error: { label: '执行异常', color: '#e07a6a', bg: '#fbeae6' },
}

const CATEGORY_EMOJI: Record<string, string> = {
  生活事务: '🗓️',
  效率办公: '📋',
  学习总结: '📚',
  内容创作: '🎨',
  数据分析: '📊',
  系统内置: '🩺',
}

interface Props {
  agent: SubAgent & { status: string }
  onTest: (id: string) => void
  onToggle: (id: string) => void
  onClick: (agent: SubAgent) => void
}

export default function HelperCard({ agent, onTest, onToggle, onClick }: Props) {
  const statusCfg = STATUS_CONFIG[agent.status] || STATUS_CONFIG.untested
  const canEnable = agent.status === 'passed'
  const canDisable = agent.status === 'enabled'
  const isTesting = agent.status === 'testing'
  const canTest = !['enabled', 'testing'].includes(agent.status)

  return (
    <div
      className="bg-card rounded-2xl shadow-card p-4 cursor-pointer transition-all duration-200 hover:shadow-soft hover:-translate-y-0.5"
      onClick={() => onClick(agent)}
    >
      <div className="flex items-start gap-3">
        <div className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-lg" style={{ background: '#f5f8f0' }}>
          {CATEGORY_EMOJI[agent.category] || '🤖'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[14px] font-semibold text-ink truncate">{agent.name}</span>
            <span className="shrink-0 text-[11px] px-2 py-0.5 rounded-full font-medium" style={{ color: statusCfg.color, background: statusCfg.bg }}>
              {statusCfg.label}
            </span>
          </div>
          <p className="text-[12.5px] text-sub mt-1 leading-relaxed">{agent.description}</p>
          {agent.required_permissions?.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {agent.required_permissions.map((p) => (
                <span key={p} className="text-[11px] px-2 py-0.5 rounded-full text-warn" style={{ background: '#faf0e2' }}>
                  {p}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-2 mt-3" onClick={(e) => e.stopPropagation()}>
        {(canTest || isTesting) && (
          <button
            onClick={() => !isTesting && onTest(agent.id)}
            disabled={isTesting}
            className="text-[12.5px] font-medium px-3.5 py-1.5 rounded-full bg-canvas text-sub hover:text-ink transition-colors"
          >
            {isTesting ? '测试中…' : '测试'}
          </button>
        )}
        {canEnable && (
          <button
            onClick={() => onToggle(agent.id)}
            className="text-[12.5px] font-medium px-3.5 py-1.5 rounded-full text-white transition-all"
            style={{ background: '#7d9c57', boxShadow: '0 5px 14px rgba(125,156,87,0.28)' }}
          >
            启用
          </button>
        )}
        {canDisable && (
          <button
            onClick={() => onToggle(agent.id)}
            className="text-[12.5px] font-medium px-3.5 py-1.5 rounded-full bg-canvas text-sub hover:text-bad transition-colors"
          >
            停用
          </button>
        )}
        {agent.status === 'disabled' && (
          <button
            onClick={() => onToggle(agent.id)}
            className="text-[12.5px] font-medium px-3.5 py-1.5 rounded-full text-white"
            style={{ background: '#7d9c57', boxShadow: '0 5px 14px rgba(125,156,87,0.28)' }}
          >
            重新启用
          </button>
        )}
      </div>
    </div>
  )
}
