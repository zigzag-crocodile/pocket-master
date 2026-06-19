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
    <div className="bg-card rounded-3xl shadow-card px-5 pt-5 pb-4 rise flex flex-col items-center text-center">
      {/* 中断按钮（右上角） */}
      {isActive && onInterrupt && (
        <button
          onClick={onInterrupt}
          className="self-end -mt-1 text-[11px] px-2.5 py-1 rounded-full text-bad font-medium transition-colors hover:bg-badsoft"
        >
          中断
        </button>
      )}

      {/* 居中放大的小当家 */}
      <div className="relative" style={{ width: 184, height: 184 }}>
        <div
          className="absolute inset-0 rounded-full"
          style={{ background: 'radial-gradient(circle at 50% 45%, rgba(125,156,87,0.18), rgba(125,156,87,0) 70%)' }}
        />
        <div className="relative flex items-center justify-center w-full h-full">
          <CharacterAvatar status={status} size={184} />
        </div>
      </div>

      {/* 名字 + 状态 chip */}
      <div className="flex items-center justify-center gap-2 mt-1.5">
        <span className="text-[17px] font-bold text-ink">小当家</span>
        <span className="text-[12px] px-2.5 py-0.5 rounded-full font-medium" style={{ color: cfg.tone, background: `${cfg.tone}1f` }}>
          {cfg.chip}
        </span>
        {isMock && (
          <span className="text-[12px] px-2.5 py-0.5 rounded-full font-medium text-mock" style={{ background: '#f4eede' }}>
            Mock
          </span>
        )}
      </div>

      {/* 一行状态文字 */}
      <p className="text-[14px] leading-relaxed mt-2 px-2" style={{ color: '#5b5f50' }}>
        {displayText}
        {isActive && <DotsLoader />}
      </p>

      {/* 执行链路（非 idle 时） */}
      {!isIdle && (
        <div className="w-full mt-3 pt-3 border-t border-hairline overflow-hidden">
          <div className="marquee-track text-[12px]" style={{ color: '#9aa08c' }}>
            <span>{doubledRoute}</span>
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
