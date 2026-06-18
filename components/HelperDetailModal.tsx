'use client'
import { useState } from 'react'

const CONFIG_FILES = ['AGENTS.md', 'IDENTITY.md', 'SOUL.md', 'MEMORY.md', 'SKILLS.md', 'TOOLS.md'] as const

type Configs = Record<string, { frontend_note: string; content: string }>

interface Props {
  name: string
  category: string
  description: string
  configs: Configs | null
  onClose: () => void
}

// 帮手集市的小帮手详情：展示 6 个配置文件 + 说明文案
export default function HelperDetailModal({ name, category, description, configs, onClose }: Props) {
  const [activeFile, setActiveFile] = useState<string>('AGENTS.md')
  const current = configs?.[activeFile]

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 sm:p-5" style={{ background: 'rgba(53,56,47,0.32)', backdropFilter: 'blur(3px)' }} onClick={onClose}>
      <div
        className="w-full max-w-md bg-card rounded-3xl shadow-lift pop-in"
        style={{ maxHeight: '88vh', display: 'flex', flexDirection: 'column' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div className="min-w-0">
            <div className="text-[16px] font-semibold text-ink">{name}</div>
            <div className="text-[12.5px] text-sub mt-0.5 truncate">{category} · {description}</div>
          </div>
          <button onClick={onClose} className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full text-faint hover:text-sub hover:bg-canvas transition-colors">✕</button>
        </div>

        <div className="px-5 pb-2 text-[11.5px] text-sub">配置文件（说明这个小帮手如何工作）</div>

        <div className="flex gap-1.5 px-5 overflow-x-auto pb-3">
          {CONFIG_FILES.map((file) => (
            <button
              key={file}
              onClick={() => setActiveFile(file)}
              className="text-[12px] px-3 py-1.5 rounded-full whitespace-nowrap font-medium transition-colors"
              style={{
                background: activeFile === file ? '#7d9c57' : '#f0f2eb',
                color: activeFile === file ? '#ffffff' : '#969a8c',
              }}
            >
              {file}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-5 pb-5">
          {current ? (
            <div className="bg-canvas rounded-2xl p-4">
              <div className="text-[12px] text-brand-deep mb-2 flex items-center gap-1.5">
                <span>💡</span>{current.frontend_note}
              </div>
              <pre className="text-[12.5px] text-ink whitespace-pre-wrap leading-relaxed" style={{ fontFamily: 'inherit' }}>
                {current.content}
              </pre>
            </div>
          ) : (
            <div className="text-sub text-[13px]">暂无该配置文件内容</div>
          )}
        </div>
      </div>
    </div>
  )
}
