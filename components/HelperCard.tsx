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
  const isEnabled = agent.status === 'enabled'
  const canEnable = agent.status === 'passed' || agent.status === 'disabled'
  const isTesting = agent.status === 'testing'

  // 卡片最右侧的主操作按钮
  let action: { label: string; kind: 'primary' | 'plain' | 'danger'; onClick: () => void; disabled?: boolean }
  if (isEnabled) action = { label: '停用', kind: 'danger', onClick: () => onToggle(agent.id) }
  else if (canEnable) action = { label: '启用', kind: 'primary', onClick: () => onToggle(agent.id) }
  else if (isTesting) action = { label: '测试中…', kind: 'plain', onClick: () => {}, disabled: true }
  else action = { label: '测试', kind: 'plain', onClick: () => onTest(agent.id) }

  const btnStyle =
    action.kind === 'primary'
      ? { background: '#7d9c57', color: '#fff', boxShadow: '0 4px 12px rgba(125,156,87,0.28)' }
      : action.kind === 'danger'
      ? { background: '#fbeae6', color: '#e07a6a' }
      : { background: '#f0f2eb', color: '#969a8c' }

  return (
    <div
      className="bg-card rounded-2xl shadow-card p-4 cursor-pointer transition-all duration-200 hover:shadow-soft hover:-translate-y-0.5"
      onClick={() => onClick(agent)}
    >
      <div className="flex items-center gap-3">
        <div className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-lg" style={{ background: '#f5f8f0' }}>
          {CATEGORY_EMOJI[agent.category] || '🤖'}
        </div>

        <div className="flex-1 min-w-0">
          <div className="text-[14px] font-semibold text-ink truncate">{agent.name}</div>
          <p className="text-[12.5px] text-sub mt-0.5 line-clamp-1">{agent.description}</p>
          {agent.required_permissions?.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {agent.required_permissions.map((p) => (
                <span key={p} className="text-[10.5px] px-1.5 py-0.5 rounded-full text-warn" style={{ background: '#faf0e2' }}>
                  {p}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* 最右侧：状态 + 启用/停用/测试 */}
        <div className="shrink-0 flex flex-col items-end gap-2" onClick={(e) => e.stopPropagation()}>
          <span className="text-[11px] px-2 py-0.5 rounded-full font-medium" style={{ color: statusCfg.color, background: statusCfg.bg }}>
            {statusCfg.label}
          </span>
          <button
            onClick={action.onClick}
            disabled={action.disabled}
            className="text-[12.5px] font-medium px-3.5 py-1.5 rounded-full transition-all"
            style={btnStyle}
          >
            {action.label}
          </button>
        </div>
      </div>
    </div>
  )
}
