'use client'
import CharacterAvatar from './CharacterAvatar'

type AgentStatus =
  | 'idle'
  | 'understanding'
  | 'routing'
  | 'waiting_permission'
  | 'subagent_running'
  | 'generating'
  | 'completed'
  | 'failed'
  | 'mock_mode'

const STATUS_MAP: Record<AgentStatus, { text: string; tone: string; chip: string }> = {
  idle: { text: '有问题尽管问我吧，我会尽力帮你解决～', tone: '#969a8c', chip: '休息中' },
  understanding: { text: '小当家正在读懂你的需求……', tone: '#6b8a48', chip: '思考中' },
  routing: { text: '小当家正在挑选合适的小帮手……', tone: '#6b8a48', chip: '调度中' },
  waiting_permission: { text: '这项任务可能涉及敏感信息，小当家想先问问你的授权范围。', tone: '#e0a15a', chip: '等待授权' },
  subagent_running: { text: '小帮手正在处理任务……', tone: '#6b8a48', chip: '执行中' },
  generating: { text: '小当家正在整理最终结果……', tone: '#6b8a48', chip: '生成中' },
  completed: { text: '小当家已经整理好了。', tone: '#6fae5a', chip: '完成' },
  failed: { text: '这次任务没跑通，小当家已把问题送进修理室。', tone: '#e07a6a', chip: '失败' },
  mock_mode: { text: 'API 没接上，先用 Mock 模式帮你跑完整流程。', tone: '#b59a6a', chip: 'Mock 模式' },
}

interface Props {
  status: AgentStatus
  routeText: string
  helperName?: string
  isMock?: boolean
  onInterrupt?: () => void
}

export default function AgentStatusPanel({ status, routeText, helperName, isMock, onInterrupt }: Props) {
  const cfg = STATUS_MAP[status]
  const isActive = ['understanding', 'routing', 'subagent_running', 'generating'].includes(status)
  const isIdle = status === 'idle'
  const displayText = helperName && status === 'subagent_running'
    ? `${helperName}正在处理任务……`
    : cfg.text

  const doubledRoute = `${routeText}　　•　　${routeText}　　•　　`

  return (
    <div className="bg-card rounded-3xl shadow-card px-5 pt-5 pb-3 rise">
      {/* character + bubble */}
      <div className="flex items-center gap-4">
        <div className="shrink-0 relative" style={{ width: 104, height: 104 }}>
          <div
            className="absolute inset-0 rounded-full"
            style={{ background: 'radial-gradient(circle at 50% 45%, rgba(125,156,87,0.14), rgba(125,156,87,0) 70%)' }}
          />
          <div className="relative flex items-center justify-center w-full h-full">
            <CharacterAvatar status={status} size={104} />
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[13.5px] font-semibold text-ink">小当家</span>
            <span
              className="text-[11px] px-2 py-0.5 rounded-full font-medium"
              style={{ color: cfg.tone, background: `${cfg.tone}1f` }}
            >
              {cfg.chip}
            </span>
            {isMock && (
              <span className="text-[11px] px-2 py-0.5 rounded-full font-medium text-mock" style={{ background: '#f4eede' }}>
                Mock
              </span>
            )}
            {isActive && onInterrupt && (
              <button
                onClick={onInterrupt}
                className="ml-auto text-[11px] px-2.5 py-1 rounded-full text-bad font-medium transition-colors hover:bg-badsoft"
              >
                中断
              </button>
            )}
          </div>

          {/* speech bubble */}
          <div className="relative bg-brand-mist rounded-2xl rounded-tl-md px-3.5 py-2.5">
            <p className="text-[13px] leading-relaxed" style={{ color: '#5b5f50' }}>
              {displayText}
              {isActive && <DotsLoader />}
            </p>
          </div>
        </div>
      </div>

      {/* floating route chain (hidden while idle) */}
      {!isIdle && (
        <div className="mt-3.5 pt-3 border-t border-hairline overflow-hidden">
          <div className="flex items-center gap-2 text-[11px] text-faint mb-1.5">
            <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: cfg.tone }} />
            执行链路
          </div>
          <div className="overflow-hidden">
            <div className="marquee-track text-[12px]" style={{ color: '#9aa08c' }}>
              <span>{doubledRoute}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function DotsLoader() {
  return (
    <span className="inline-flex gap-0.5 ml-1 align-middle">
      <span className="tdot inline-block w-1 h-1 rounded-full" style={{ background: '#9bb877' }} />
      <span className="tdot tdot2 inline-block w-1 h-1 rounded-full" style={{ background: '#9bb877' }} />
      <span className="tdot tdot3 inline-block w-1 h-1 rounded-full" style={{ background: '#9bb877' }} />
    </span>
  )
}

export type { AgentStatus }
