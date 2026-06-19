'use client'
import { useState } from 'react'
import { SubAgent } from '@/data/mock_data'
import HelperCard from './HelperCard'
import HelperHistoryModal from './HelperHistoryModal'

type AgentWithStatus = SubAgent & { status: string }

interface Props {
  agents: AgentWithStatus[]
  onAgentsChange: (agents: AgentWithStatus[]) => void
  onOpenMarketplace: () => void
}

export default function MyHelpersPanel({ agents, onAgentsChange, onOpenMarketplace }: Props) {
  const [historyOf, setHistoryOf] = useState<{ id: string; name: string } | null>(null)

  // 滑动开关：启用↔停用；未测试/异常时先自动测试再启用
  const handleSwitch = (id: string) => {
    const a = agents.find((x) => x.id === id)
    if (!a || a.status === 'testing') return
    if (a.is_enabled) {
      onAgentsChange(agents.map((x) => (x.id === id ? { ...x, status: 'disabled', is_enabled: false } : x)))
    } else if (a.status === 'passed' || a.status === 'disabled') {
      onAgentsChange(agents.map((x) => (x.id === id ? { ...x, status: 'enabled', is_enabled: true } : x)))
    } else {
      onAgentsChange(agents.map((x) => (x.id === id ? { ...x, status: 'testing' } : x)))
      setTimeout(() => {
        onAgentsChange(
          agents.map((x) =>
            x.id === id
              ? {
                  ...x,
                  status: 'enabled',
                  is_enabled: true,
                  last_test_result: { status: 'passed', test_input: '测试输入示例', summary: '测试通过，已自动启用。', tested_at: new Date().toISOString() },
                }
              : { ...x }
          )
        )
      }, 1500)
    }
  }

  const enabledCount = agents.filter((a) => a.is_enabled).length

  return (
    <div className="px-4 py-4">
      <div className="flex items-center gap-2 mb-3 px-1">
        <span className="text-[13px] text-sub">
          已安装 <span className="text-ink font-semibold">{agents.length}</span> 个 · 已启用 <span className="text-brand-deep font-semibold">{enabledCount}</span> 个
        </span>
      </div>

      {agents.length === 0 ? (
        <div className="text-sub text-[13px] text-center py-12 bg-card rounded-2xl shadow-card">还没有安装小帮手，去帮手集市看看吧。</div>
      ) : (
        <div className="space-y-3">
          {agents.map((agent) => (
            <HelperCard key={agent.id} agent={agent} onToggle={handleSwitch} onClick={(a) => setHistoryOf({ id: a.id, name: a.name })} />
          ))}
        </div>
      )}

      {/* 帮手集市入口（长胶囊） */}
      <button
        onClick={onOpenMarketplace}
        className="w-full mt-4 py-3.5 rounded-full text-[13.5px] font-medium flex items-center justify-center gap-2 transition-all hover:shadow-soft"
        style={{ background: '#eef4e6', color: '#6b8a48' }}
      >
        <span>🛒</span> 帮手集市
      </button>

      {historyOf && <HelperHistoryModal helperId={historyOf.id} helperName={historyOf.name} onClose={() => setHistoryOf(null)} />}
    </div>
  )
}
