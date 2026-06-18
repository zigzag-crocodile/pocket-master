'use client'
import { SubAgent } from '@/data/mock_data'

const CATEGORY_EMOJI: Record<string, string> = {
  生活事务: '🗓️',
  效率办公: '📋',
  学习总结: '📚',
  内容创作: '🎨',
  数据分析: '📊',
  系统内置: '🩺',
}

const STATUS_HINT: Record<string, string> = {
  untested: '未测试',
  testing: '测试中…',
  passed: '可启用',
  disabled: '已停用',
  error: '执行异常',
  enabled: '已启用',
}

interface Props {
  agent: SubAgent & { status: string }
  onToggle: (id: string) => void
  onClick: (agent: SubAgent) => void
}

export default function HelperCard({ agent, onToggle, onClick }: Props) {
  const isEnabled = agent.status === 'enabled'
  const isTesting = agent.status === 'testing'

  return (
    <div
      className="bg-card rounded-2xl shadow-card p-4 cursor-pointer transition-all duration-200 hover:shadow-soft hover:-translate-y-0.5"
      onClick={() => onClick(agent)}
    >
      <div className="flex items-center gap-3">
        <div className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-lg" style={{ background: '#eef4e6' }}>
          {CATEGORY_EMOJI[agent.category] || '🤖'}
        </div>

        <div className="flex-1 min-w-0">
          <div className="text-[14px] font-semibold text-ink truncate">{agent.name}</div>
          <p className="text-[12.5px] text-sub mt-0.5 line-clamp-1">{agent.description}</p>
        </div>

        {/* 右侧：滑动开关（启用/停用） */}
        <div className="shrink-0 flex flex-col items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            role="switch"
            aria-checked={isEnabled}
            disabled={isTesting}
            onClick={() => onToggle(agent.id)}
            className="relative rounded-full transition-colors duration-200"
            style={{
              width: 42,
              height: 24,
              background: isEnabled ? '#7d9c57' : isTesting ? '#e0a15a' : '#dfe3d8',
              cursor: isTesting ? 'wait' : 'pointer',
            }}
          >
            <span
              className="absolute top-0.5 rounded-full bg-white shadow transition-all duration-200"
              style={{ width: 20, height: 20, left: isEnabled ? 20 : 2 }}
            />
          </button>
          <span className="text-[10.5px]" style={{ color: isEnabled ? '#6b8a48' : '#969a8c' }}>
            {STATUS_HINT[agent.status] || ''}
          </span>
        </div>
      </div>
    </div>
  )
}
