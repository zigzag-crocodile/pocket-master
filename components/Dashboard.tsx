'use client'
import { useState, useCallback, useEffect } from 'react'
import AgentStatusPanel, { AgentStatus } from '@/components/AgentStatusPanel'
import MainInputBox from '@/components/MainInputBox'
import MyHelpersPanel from '@/components/MyHelpersPanel'
import MarketplacePanel from '@/components/MarketplacePanel'
import RepairRoom from '@/components/RepairRoom'
import OutputPanel from '@/components/OutputPanel'
import PermissionModal from '@/components/PermissionModal'
import { mockData, SubAgent, MarketplaceTemplate, RepairLog } from '@/data/mock_data'
import { isSupabaseConfigured } from '@/lib/supabase'
import { loadSubagents, upsertSubagents, recordRun, recordRepair, recordExport, loadRepairLogs, computeLedger, AgentRow, LedgerData } from '@/lib/db'

type Tab = '我的小帮手' | '帮手集市' | '修理室'

interface AgentWithStatus extends SubAgent {
  status: string
}

interface Props {
  userEmail: string
  onSignOut?: () => void
}

interface PendingTask {
  input: string
  taskType?: string
  helper?: string
  helperName?: string
  routeChain?: string[]
  sensitiveTypes?: string[]
}

export default function Dashboard({ userEmail, onSignOut }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('我的小帮手')
  const [agentStatus, setAgentStatus] = useState<AgentStatus>('idle')
  const [routeText, setRouteText] = useState('小当家 → 等待任务')
  const [helperName, setHelperName] = useState<string>()
  const [isMock, setIsMock] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [output, setOutput] = useState<{ content: string; taskType: string; routeChain: string[]; isMock: boolean; artifacts?: { ics?: { filename: string; content: string } } } | null>(null)
  const [pendingTask, setPendingTask] = useState<PendingTask | null>(null)
  const supaMode = isSupabaseConfigured()
  const [repairLogs, setRepairLogs] = useState<RepairLog[]>(supaMode ? [] : mockData.repair_logs)
  const [agents, setAgents] = useState<AgentWithStatus[]>(
    supaMode ? [] : mockData.installed_subagents.map((a) => ({ ...a }))
  )
  const [ledger, setLedger] = useState<LedgerData | null>(null)

  const installedIds = agents.map((a) => a.id)

  // Supabase 模式：登录后从数据库加载小帮手 / 修理记录 / 账本指标
  useEffect(() => {
    if (!supaMode) return
    let active = true
    ;(async () => {
      const [subs, logs, led] = await Promise.all([loadSubagents(), loadRepairLogs(), computeLedger()])
      if (!active) return
      if (subs) setAgents(subs)
      if (logs) setRepairLogs(logs)
      if (led) setLedger(led)
    })()
    return () => { active = false }
  }, [supaMode])

  // 小帮手变更：本地更新 + Supabase 写回
  const updateAgents = useCallback((next: AgentWithStatus[]) => {
    setAgents(next)
    if (supaMode) upsertSubagents(next as AgentRow[])
  }, [supaMode])

  const refreshLedger = useCallback(async () => {
    if (!supaMode) return
    const led = await computeLedger()
    if (led) setLedger(led)
  }, [supaMode])

  const handleInstall = useCallback((template: MarketplaceTemplate) => {
    const fromMock = mockData.installed_subagents.find((a) => a.id === template.id)
    const newAgent: AgentWithStatus = fromMock
      ? { ...fromMock, status: 'untested', is_enabled: false }
      : {
          id: template.id,
          user_id: 'user_demo_001',
          name: template.name,
          category: template.category,
          description: template.description,
          status: 'untested',
          is_enabled: false,
          required_permissions: template.required_permissions,
          last_called_at: new Date().toISOString(),
          last_test_result: { status: 'untested', test_input: '', summary: '尚未测试', tested_at: '' },
          configs: {
            'AGENTS.md': { frontend_note: '这个小帮手的工作说明书，说明它如何被小当家调度。', content: `${template.name} 的调度配置。` },
            'IDENTITY.md': { frontend_note: '这个小帮手的身份牌，说明它是谁、负责什么。', content: template.description },
            'SOUL.md': { frontend_note: '这个小帮手的性格卡，说明它的表达风格和行为边界。', content: '专业、简洁、有条理。' },
            'MEMORY.md': { frontend_note: '这个小帮手的小账本，记录它需要记住的偏好、规则和历史信息。', content: '暂无历史记录。' },
            'SKILLS.md': { frontend_note: '这个小帮手会使用哪些 Skill。', content: '待配置' },
            'TOOLS.md': { frontend_note: '这个小帮手能调用哪些 Tool。', content: 'MarkdownExportTool、TaskLogTool' },
          },
        }
    updateAgents([...agents, newAgent])
    setActiveTab('我的小帮手')
  }, [agents, updateAgents])

  const pushRepair = async (log: Omit<RepairLog, 'id' | 'user_id' | 'created_at' | 'run_id'> & { run_id?: string | null }) => {
    if (supaMode) {
      await recordRepair(log)
      const logs = await loadRepairLogs()
      if (logs) setRepairLogs(logs)
    } else {
      setRepairLogs((prev) => [{ ...log, id: `repair_${Date.now()}`, user_id: 'user_demo_001', run_id: log.run_id || `run_${Date.now()}`, created_at: new Date().toISOString() } as RepairLog, ...prev])
    }
  }

  const runAgentFlow = async (input: string, permissionScope?: string) => {
    setIsProcessing(true)
    setOutput(null)
    const startedAt = Date.now()

    setAgentStatus('understanding')
    await delay(600)

    setAgentStatus('routing')
    await delay(500)

    try {
      const enabledHelpers = agents
        .filter((a) => a.is_enabled)
        .map((a) => ({ id: a.id, name: a.name, description: a.description }))
      const res = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input, permissionScope, enabledHelpers }),
      })
      const data = await res.json()

      if (data.needPermission) {
        setPendingTask({ input, sensitiveTypes: data.sensitiveTypes, taskType: data.taskType, helper: data.helper, helperName: data.helperName, routeChain: data.routeChain })
        setAgentStatus('waiting_permission')
        setIsProcessing(false)
        return
      }

      if (data.cancelled) {
        setAgentStatus('idle')
        setRouteText('小当家 → 等待任务')
        setIsProcessing(false)
        return
      }

      const enabledHelper = agents.find((a) => a.id === data.helper && a.is_enabled)
      if (!enabledHelper && data.helper !== 'clinic-helper') {
        const fallback = agents.find((a) => a.is_enabled)
        if (!fallback) {
          setAgentStatus('failed')
          await pushRepair({
            issue_type: 'routing_error',
            issue_type_text: '调度错误',
            diagnosis: `目标小帮手 ${data.helperName} 未启用，且没有可用的已启用小帮手。`,
            suggestion: '请进入"我的小帮手"测试并启用至少一个小帮手，然后重试。',
            can_auto_fix: false,
            fixed: false,
          })
          setIsProcessing(false)
          return
        }
      }

      setHelperName(data.helperName)
      setRouteText(data.routeChain?.join(' → ') || '小当家 → 小帮手')
      setAgentStatus('subagent_running')
      await delay(700)

      if (data.isMock) {
        setIsMock(true)
        setAgentStatus('mock_mode')
        await delay(400)
      } else {
        setIsMock(false)
        setAgentStatus('generating')
        await delay(500)
      }

      setOutput({ content: data.output, taskType: data.taskType, routeChain: data.routeChain, isMock: data.isMock, artifacts: data.artifacts })
      // mock 任务停留在 mock 情绪（吉祥物呈现"困倦/创可贴"造型），真实任务停在完成
      setAgentStatus(data.isMock ? 'mock_mode' : 'completed')

      // 持久化到 Supabase
      let runId: string | null = null
      if (supaMode) {
        runId = await recordRun({
          input,
          output: data.output,
          outputType: data.taskType === 'vision_prompt_task' ? 'prompt' : 'markdown',
          taskType: data.taskType,
          routeChain: data.routeChain || [],
          calledSubagents: [data.helper],
          modelUsed: data.modelUsed,
          isMock: data.isMock,
          success: true,
          errorMessage: data.errorMessage || null,
          latencyMs: Date.now() - startedAt,
        })
      }
      if (data.isMock) {
        await pushRepair({
          run_id: runId,
          issue_type: 'model_error',
          issue_type_text: '模型失败',
          diagnosis: data.errorMessage || '模型 API 未配置或调用失败，系统已切换至 Mock 模式。',
          suggestion: '检查 LLM_API_KEY / LLM_BASE_URL / LLM_MODEL 配置后重启服务再试。',
          can_auto_fix: false,
          fixed: false,
        })
      }
      await refreshLedger()
    } catch {
      setAgentStatus('failed')
      if (supaMode) {
        const runId = await recordRun({ input, output: '', outputType: 'markdown', taskType: 'unknown', routeChain: ['小当家'], calledSubagents: [], modelUsed: '-', isMock: false, success: false, errorMessage: '网络请求失败', latencyMs: Date.now() - startedAt })
        await pushRepair({ run_id: runId, issue_type: 'model_error', issue_type_text: '模型失败', diagnosis: '网络请求失败，无法连接到 Agent 服务。', suggestion: '检查网络连接和服务是否正常运行。', can_auto_fix: false, fixed: false })
        await refreshLedger()
      } else {
        await pushRepair({ issue_type: 'model_error', issue_type_text: '模型失败', diagnosis: '网络请求失败，无法连接到 Agent 服务。', suggestion: '检查网络连接和服务是否正常运行。', can_auto_fix: false, fixed: false })
      }
    } finally {
      setIsProcessing(false)
    }
  }

  const handleSubmit = async (input: string) => {
    await runAgentFlow(input)
  }

  const handlePermissionChoice = async (scope: string) => {
    if (!pendingTask) return
    setPendingTask(null)
    await runAgentFlow(pendingTask.input, scope)
  }

  const handleInterrupt = () => {
    setIsProcessing(false)
    setAgentStatus('idle')
    setRouteText('小当家 → 等待任务')
    setHelperName(undefined)
  }

  const unfixedCount = repairLogs.filter((r) => !r.fixed).length

  return (
    <div className="max-w-md mx-auto min-h-screen flex flex-col bg-canvas">
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 py-3.5">
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center w-7 h-7 rounded-xl text-white text-sm" style={{ background: 'linear-gradient(135deg,#94b56a,#6b8a48)' }}>
            🌱
          </span>
          <span className="text-[15px] font-bold text-ink tracking-tight">随身小当家</span>
        </div>
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-[12px] text-sub truncate max-w-[140px]">{userEmail || 'demo'}</span>
          {onSignOut && (
            <button
              onClick={onSignOut}
              className="shrink-0 text-[11.5px] text-faint hover:text-bad transition-colors px-1.5 py-0.5"
            >
              退出
            </button>
          )}
        </div>
      </div>

      {/* Agent status panel */}
      <div className="px-4">
        <AgentStatusPanel
          status={agentStatus}
          routeText={routeText}
          helperName={helperName}
          isMock={isMock}
          onInterrupt={isProcessing ? handleInterrupt : undefined}
        />
      </div>

      {/* Input box */}
      <div className="px-4 mt-3">
        <MainInputBox onSubmit={handleSubmit} disabled={isProcessing} />
      </div>

      {/* Output */}
      {output && (
        <div className="px-4 mt-3">
          <OutputPanel
            content={output.content}
            isMock={output.isMock}
            taskType={output.taskType}
            routeChain={output.routeChain}
            artifacts={output.artifacts}
            onClose={() => setOutput(null)}
            onExport={(type) => { if (supaMode) recordExport(output.taskType, type).then(refreshLedger) }}
          />
        </div>
      )}

      {/* Tab navigation — clean text tabs */}
      <div className="flex mx-4 mt-4 sticky top-0 z-10 bg-canvas border-b border-hairline">
        {(['我的小帮手', '帮手集市', '修理室'] as Tab[]).map((tab, i) => {
          const active = activeTab === tab
          return (
            <div key={tab} className="flex-1 flex items-center justify-center relative">
              {i > 0 && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-px h-3.5" style={{ background: '#e6e9df' }} />
              )}
              <button
                onClick={() => setActiveTab(tab)}
                className="relative w-full py-3 text-[13px] transition-colors"
                style={{ color: active ? '#6b8a48' : '#969a8c', fontWeight: active ? 600 : 400 }}
              >
                <span className="inline-flex items-center justify-center gap-1">
                  {tab}
                  {tab === '修理室' && unfixedCount > 0 && (
                    <span
                      className="min-w-[15px] h-[15px] px-1 inline-flex items-center justify-center rounded-full text-white"
                      style={{ background: '#e07a6a', fontSize: 9 }}
                    >
                      {unfixedCount}
                    </span>
                  )}
                </span>
                {active && (
                  <span className="absolute left-1/2 -translate-x-1/2 bottom-0 h-[2px] w-7 rounded-full" style={{ background: '#7d9c57' }} />
                )}
              </button>
            </div>
          )
        })}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto pb-6">
        {activeTab === '我的小帮手' && <MyHelpersPanel agents={agents} onAgentsChange={updateAgents} />}
        {activeTab === '帮手集市' && <MarketplacePanel installedIds={installedIds} onInstall={handleInstall} />}
        {activeTab === '修理室' && (
          <RepairRoom
            repairLogs={repairLogs}
            metrics={ledger ? ledger.metrics : mockData.ledger_metrics.metrics}
            summary={ledger ? ledger.summary : undefined}
          />
        )}
      </div>

      {/* Permission modal */}
      {pendingTask?.sensitiveTypes && (
        <PermissionModal sensitiveTypes={pendingTask.sensitiveTypes} onChoose={handlePermissionChoice} />
      )}
    </div>
  )
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}
