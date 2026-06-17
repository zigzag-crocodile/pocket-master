'use client'
import { useState } from 'react'

interface Props {
  onSubmit: (input: string) => void
  disabled?: boolean
}

const PLACEHOLDERS = [
  '说说看，需要小当家帮你做点什么？',
  '帮我整理这段会议记录……',
  '面试里怎么讲这个项目？',
  '帮我把明天下午三点的面试整理成提醒。',
]

export default function MainInputBox({ onSubmit, disabled }: Props) {
  const [value, setValue] = useState('')
  const [placeholder] = useState(() => PLACEHOLDERS[Math.floor(Math.random() * PLACEHOLDERS.length)])

  const handleSubmit = () => {
    const trimmed = value.trim()
    if (!trimmed || disabled) return
    onSubmit(trimmed)
    setValue('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSubmit()
    }
  }

  const canSend = !disabled && !!value.trim()

  return (
    <div className="bg-card rounded-full shadow-card pl-5 pr-2 py-2 flex items-center gap-2 transition-shadow focus-within:shadow-soft">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={disabled ? '小当家处理中…' : placeholder}
        disabled={disabled}
        className="flex-1 min-w-0 bg-transparent text-[14px] text-ink outline-none placeholder:text-faint"
      />
      <button
        onClick={handleSubmit}
        disabled={!canSend}
        aria-label="发送"
        className="shrink-0 w-9 h-9 flex items-center justify-center rounded-full transition-all duration-200"
        style={{
          background: canSend ? '#7d9c57' : '#eef0e9',
          boxShadow: canSend ? '0 5px 14px rgba(125,156,87,0.30)' : 'none',
          cursor: canSend ? 'pointer' : 'not-allowed',
        }}
      >
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={canSend ? '#ffffff' : '#c3c7ba'} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="7" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      </button>
    </div>
  )
}
