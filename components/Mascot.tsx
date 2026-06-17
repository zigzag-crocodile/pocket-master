'use client'

export type Mood = 'idle' | 'thinking' | 'routing' | 'running' | 'completed' | 'error' | 'mock'

// 把工程状态映射到吉祥物情绪
export function moodFromStatus(status: string): Mood {
  switch (status) {
    case 'understanding': return 'thinking'
    case 'waiting_permission': return 'thinking'
    case 'routing': return 'routing'
    case 'subagent_running': return 'running'
    case 'generating': return 'running'
    case 'completed': return 'completed'
    case 'failed': return 'error'
    case 'mock_mode': return 'mock'
    default: return 'idle'
  }
}

const BODY_ANIM: Record<Mood, string> = {
  idle: 'm-idle',
  thinking: 'm-thinking',
  routing: 'm-routing',
  running: 'm-running',
  completed: 'm-completed',
  error: 'm-error',
  mock: 'm-mock',
}

const INK = '#3a3c4d'

interface Props {
  mood: Mood
  size?: number
}

export default function Mascot({ mood, size = 132 }: Props) {
  const isMock = mood === 'mock'
  const cheekOpacity = mood === 'error' ? 0.28 : isMock ? 0.3 : 0.55

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={`小当家 - ${mood}`}
    >
      <defs>
        <radialGradient id="bodyGrad" cx="38%" cy="30%" r="78%">
          <stop offset="0%" stopColor="#c2dba0" />
          <stop offset="48%" stopColor="#94b56a" />
          <stop offset="100%" stopColor="#6b8a48" />
        </radialGradient>
        <radialGradient id="mockGrad" cx="38%" cy="30%" r="78%">
          <stop offset="0%" stopColor="#dcdcd2" />
          <stop offset="55%" stopColor="#bdbdb0" />
          <stop offset="100%" stopColor="#a3a395" />
        </radialGradient>
        <radialGradient id="antGrad" cx="35%" cy="30%" r="75%">
          <stop offset="0%" stopColor="#fef4c8" />
          <stop offset="100%" stopColor={isMock ? '#b3b6a6' : '#f3c95c'} />
        </radialGradient>
      </defs>

      {/* ground shadow */}
      <ellipse cx="100" cy="182" rx="46" ry="9" fill="#34382f" opacity="0.14" className={mood === 'idle' ? 'shadow-anim' : ''} />

      {/* orbiting dots — behind body, only routing/running */}
      {(mood === 'routing' || mood === 'running') && (
        <g>
          <g>
            <animateTransform attributeName="transform" type="rotate"
              from="0 100 96" to="360 100 96"
              dur={mood === 'running' ? '1.4s' : '2.6s'} repeatCount="indefinite" />
            <circle cx="100" cy="30" r="4" fill="#9bb877" opacity="0.9" />
            <circle cx="166" cy="96" r="3.4" fill="#b9cf99" opacity="0.75" />
            <circle cx="34" cy="96" r="3" fill="#cfe0b3" opacity="0.7" />
          </g>
        </g>
      )}

      {/* ===== body group (animated) ===== */}
      <g className={BODY_ANIM[mood]} style={{ transformOrigin: '100px 100px' }}>
        {/* antenna */}
        <line x1="100" y1="46" x2="100" y2="30" stroke={isMock ? '#b3b6a6' : '#6b8a48'} strokeWidth="4" strokeLinecap="round" />
        <circle cx="100" cy="24" r="6" fill="url(#antGrad)" className={mood === 'idle' ? 'ping-soft' : ''} style={{ borderRadius: '50%' }} />

        {/* body */}
        <ellipse cx="100" cy="100" rx="55" ry="58" fill={isMock ? 'url(#mockGrad)' : 'url(#bodyGrad)'} />
        {/* gloss highlight */}
        <ellipse cx="82" cy="74" rx="22" ry="15" fill="#ffffff" opacity="0.28" />
        {/* belly light */}
        <ellipse cx="100" cy="122" rx="33" ry="28" fill="#ffffff" opacity="0.10" />

        {/* cheeks */}
        <ellipse cx="71" cy="110" rx="8" ry="5.5" fill="#ff9fb6" opacity={cheekOpacity} />
        <ellipse cx="129" cy="110" rx="8" ry="5.5" fill="#ff9fb6" opacity={cheekOpacity} />

        {/* face */}
        <Face mood={mood} />

        {/* mock bandage cue */}
        {isMock && (
          <g transform="rotate(-18 78 128)">
            <rect x="66" y="122" width="24" height="11" rx="5.5" fill="#f6e2c8" stroke="#e7cda6" strokeWidth="1" />
            <circle cx="78" cy="127.5" r="3.4" fill="#ecd3ad" />
          </g>
        )}
      </g>

      {/* ===== accessories (outside body motion) ===== */}
      {mood === 'thinking' && (
        <g fill="#b9cf99">
          <circle cx="150" cy="44" r="3" className="tdot tdot3" />
          <circle cx="160" cy="32" r="4" className="tdot tdot2" />
          <circle cx="172" cy="20" r="5" className="tdot" />
        </g>
      )}

      {mood === 'completed' && (
        <g fill="#f3c95c">
          <Star x={154} y={52} className="spark" />
          <Star x={48} y={60} className="spark spark2" />
        </g>
      )}

      {mood === 'error' && (
        <path d="M150 56 C150 56 144 66 144 71 a6 6 0 1 0 12 0 C156 66 150 56 150 56 Z" fill="#8fcfe0" opacity="0.9" />
      )}

      {isMock && (
        <g fill="#969a8c" fontFamily="-apple-system, sans-serif" fontStyle="italic" fontWeight={700}>
          <text x="146" y="42" fontSize="15" className="tdot">z</text>
          <text x="158" y="30" fontSize="19" className="tdot tdot2">Z</text>
        </g>
      )}
    </svg>
  )
}

function Face({ mood }: { mood: Mood }) {
  // mouth
  let mouth: JSX.Element
  switch (mood) {
    case 'completed':
      mouth = (
        <g>
          <path d="M86 116 q14 17 28 0 z" fill={INK} />
          <path d="M93 124 q7 6 14 0 z" fill="#ff9fb6" />
        </g>
      )
      break
    case 'running':
      mouth = <ellipse cx="100" cy="120" rx="8" ry="6.5" fill={INK} />
      break
    case 'error':
      mouth = <path d="M91 123 q9 -8 18 0" stroke={INK} strokeWidth="3" strokeLinecap="round" fill="none" />
      break
    case 'mock':
      mouth = <path d="M93 120 h14" stroke={INK} strokeWidth="3" strokeLinecap="round" fill="none" />
      break
    case 'thinking':
      mouth = <path d="M94 120 q6 4 12 0" stroke={INK} strokeWidth="2.6" strokeLinecap="round" fill="none" />
      break
    default: // idle / routing
      mouth = <path d="M90 117 q10 9 20 0" stroke={INK} strokeWidth="3" strokeLinecap="round" fill="none" />
  }

  // eyes
  let eyes: JSX.Element
  if (mood === 'completed') {
    eyes = (
      <g stroke={INK} strokeWidth="3.4" strokeLinecap="round" fill="none">
        <path d="M73 96 q8 -9 16 0" />
        <path d="M111 96 q8 -9 16 0" />
      </g>
    )
  } else if (mood === 'mock') {
    // sleepy closed eyes
    eyes = (
      <g stroke={INK} strokeWidth="3" strokeLinecap="round" fill="none">
        <path d="M73 94 q8 6 16 0" />
        <path d="M111 94 q8 6 16 0" />
      </g>
    )
  } else if (mood === 'error') {
    // worried small eyes + brows
    eyes = (
      <g>
        <ellipse cx="81" cy="96" rx="5.5" ry="6.5" fill={INK} />
        <ellipse cx="119" cy="96" rx="5.5" ry="6.5" fill={INK} />
        <path d="M72 84 l14 5" stroke={INK} strokeWidth="2.6" strokeLinecap="round" />
        <path d="M128 84 l-14 5" stroke={INK} strokeWidth="2.6" strokeLinecap="round" />
      </g>
    )
  } else {
    // open eyes (idle / thinking / routing / running) with blink + highlight
    const blink = mood === 'idle' ? 'eye-blink' : ''
    eyes = (
      <g>
        <g className={blink}>
          <ellipse cx="81" cy="95" rx="6.5" ry="9" fill={INK} />
          <circle cx="83.5" cy="91.5" r="2.2" fill="#ffffff" />
        </g>
        <g className={blink}>
          <ellipse cx="119" cy="95" rx="6.5" ry="9" fill={INK} />
          <circle cx="121.5" cy="91.5" r="2.2" fill="#ffffff" />
        </g>
      </g>
    )
  }

  return (
    <g>
      {eyes}
      {mouth}
    </g>
  )
}

function Star({ x, y, className }: { x: number; y: number; className?: string }) {
  return (
    <path
      className={className}
      transform={`translate(${x} ${y})`}
      d="M0 -7 L1.8 -1.8 L7 0 L1.8 1.8 L0 7 L-1.8 1.8 L-7 0 L-1.8 -1.8 Z"
    />
  )
}
