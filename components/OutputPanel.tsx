'use client'
import { useState } from 'react'
import { downloadMarkdown, copyToClipboard } from '@/lib/export'

function renderMarkdown(md: string): string {
  return md
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/^\| (.+) \|$/gm, (line) => {
      const cells = line.split('|').filter(Boolean).map((c) => c.trim())
      return '<tr>' + cells.map((c) => `<td>${c}</td>`).join('') + '</tr>'
    })
    .replace(/(<tr>.*<\/tr>)/gs, (match) => {
      const rows = match.match(/<tr>.*?<\/tr>/gs) || []
      if (rows.length < 2) return match
      const header = rows[0]
      if (!header) return match
      const body = rows.slice(1)
      const headerRow = header.replace(/<td>/g, '<th>').replace(/<\/td>/g, '</th>')
      return `<table><thead>${headerRow}</thead><tbody>${body.join('')}</tbody></table>`
    })
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/g, (m) => `<ul>${m}</ul>`)
    .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/^(?!<[htublp])(.+)$/gm, '<p>$1</p>')
    .replace(/<p><\/p>/g, '')
}

interface Props {
  content: string
  isMock: boolean
  taskType: string
  routeChain: string[]
  artifacts?: { ics?: { filename: string; content: string } }
  onClose: () => void
  onExport?: (type: 'markdown' | 'json' | 'copy') => void
  onAddToSchedule?: () => void
}

export default function OutputPanel({ content, isMock, taskType, routeChain, artifacts, onClose, onExport, onAddToSchedule }: Props) {
  const [added, setAdded] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleIcsDownload = () => {
    if (!artifacts?.ics) return
    const blob = new Blob([artifacts.ics.content], { type: 'text/calendar;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = artifacts.ics.filename
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleCopy = async () => {
    await copyToClipboard(content)
    setCopied(true)
    onExport?.('copy')
    setTimeout(() => setCopied(false), 2000)
  }

  const handleMarkdownExport = () => {
    downloadMarkdown(content, `pocket-master-${taskType}`)
    onExport?.('markdown')
  }

  return (
    <div className="bg-card rounded-3xl shadow-card overflow-hidden rise">
      {/* header */}
      <div className="flex items-center justify-between px-4 pt-3.5 pb-2.5">
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-semibold text-ink">小当家的整理</span>
          {isMock && (
            <span className="text-[11px] px-2 py-0.5 rounded-full font-medium text-mock" style={{ background: '#f4eede' }}>
              Mock
            </span>
          )}
        </div>
        <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-full text-faint hover:text-sub hover:bg-canvas transition-colors">
          ✕
        </button>
      </div>

      {/* route chain */}
      <div className="px-4 pb-2.5">
        <div className="text-[11.5px] text-faint truncate">{routeChain.join(' · ')}</div>
      </div>

      {/* content */}
      <div
        className="md-output px-4 pb-3 text-[13px] overflow-y-auto border-t border-hairline pt-3"
        style={{ maxHeight: '42vh' }}
        dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
      />

      {/* actions */}
      <div className="flex items-center gap-2 px-4 py-3 border-t border-hairline flex-wrap">
        {onAddToSchedule && (
          <button
            onClick={() => { onAddToSchedule(); setAdded(true) }}
            disabled={added}
            className="text-[12.5px] font-medium px-3.5 py-1.5 rounded-full text-white transition-colors"
            style={{ background: added ? '#9bb877' : '#7d9c57' }}
          >
            {added ? '✓ 已写入日程' : '📌 写入日程'}
          </button>
        )}
        {artifacts?.ics && (
          <button
            onClick={handleIcsDownload}
            className="text-[12.5px] font-medium px-3.5 py-1.5 rounded-full transition-colors"
            style={{ background: '#f5f8f0', color: '#6b8a48' }}
          >
            📅 .ics
          </button>
        )}
        <div className="ml-auto flex items-center gap-2">
          {/* 复制图标 */}
          <button
            onClick={handleCopy}
            aria-label="复制"
            title={copied ? '已复制' : '复制'}
            className="w-9 h-9 flex items-center justify-center rounded-full transition-colors"
            style={{ background: copied ? '#e9f3e2' : '#f5f8f0', color: copied ? '#6fae5a' : '#6b8a48' }}
          >
            {copied ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
            )}
          </button>
          {/* 导出 Markdown 小按钮 */}
          <button onClick={handleMarkdownExport} className="text-[12px] font-medium px-3 py-1.5 rounded-full bg-canvas text-sub hover:text-ink transition-colors">
            导出 .md
          </button>
        </div>
      </div>
    </div>
  )
}
