'use client'
import { useState } from 'react'
import { SubAgent } from '@/data/mock_data'
import HelperCard from './HelperCard'
import HelperHistoryModal from './HelperHistoryModal'

type AgentWithStatus = SubAgent & { status: string }

interface Props {
  agents: AgentWithStatus[]
  onAgentsChange: (agents: AgentWithStatus[]) => void
}

export default function MyHelpersPanel({ agents, onAgentsChange }: Props) {
  const [historyOf, setHistoryOf] = useState<{ id: string; name: string } | null>(null)

  const handleTest = (id: string) => {
    onAgentsChange(agents.map((a) => (a.id === id ? { ...a, status: 'testing' } : a)))
    setTimeout(() => {
      onAgentsChange(
        agents.map((a) =>
          a.id === id
            ? {
                ...a,
                status: 'passed',
                last_test_result: {
                  status: 'passed',
                  test_input: '测试输入示例',
                  summary: '测试通过，小帮手运行正常，可以启用。',
                  tested_at: new Date().toISOString(),
                },
              }
            : { ...a }
        )
      )
    }, 1500)
  }

  const handleToggle = (id: string) => {
    onAgentsChange(
      agents.map((a) => {
        if (a.id !== id) return a
        if (a.status === 'enabled') return { ...a, status: 'disabled', is_enabled: false }
        if (a.status === 'passed' || a.status === 'disabled') return { ...a, status: 'enabled', is_enabled: true }
        return a
      })
    )
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
        <div className="text-sub text-[13px] text-center py-12 bg-card rounded-2xl shadow-card">
          还没有安装小帮手，去帮手集市看看吧。
        </div>
      ) : (
        <div className="space-y-3">
          {agents.map((agent) => (
            <HelperCard
              key={agent.id}
              agent={agent}
              onTest={handleTest}
              onToggle={handleToggle}
              onClick={(a) => setHistoryOf({ id: a.id, name: a.name })}
            />
          ))}
        </div>
      )}
      {historyOf && <HelperHistoryModal helperId={historyOf.id} helperName={historyOf.name} onClose={() => setHistoryOf(null)} />}
    </div>
  )
}
