'use client'
import { useState, useRef, useEffect } from 'react'

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

const AUDIO_RE = /\.(mp3|wav|m4a|webm|ogg|mp4|mpeg|mpga|aac|flac)$/i

function fmt(sec: number) {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export default function MainInputBox({ onSubmit, disabled }: Props) {
  const [value, setValue] = useState('')
  const [placeholder] = useState(() => PLACEHOLDERS[Math.floor(Math.random() * PLACEHOLDERS.length)])
  const [attached, setAttached] = useState<{ name: string; content: string } | null>(null)
  const [recording, setRecording] = useState(false)
  const [paused, setPaused] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [transcribing, setTranscribing] = useState(false)
  const [audioSupported, setAudioSupported] = useState(false)
  const [note, setNote] = useState('')

  const fileRef = useRef<HTMLInputElement>(null)
  const recRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    const ok = typeof window !== 'undefined' && !!navigator.mediaDevices?.getUserMedia && typeof window.MediaRecorder !== 'undefined'
    setAudioSupported(ok)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      try { recRef.current?.stream?.getTracks().forEach((t) => t.stop()) } catch {}
    }
  }, [])

  const flashNote = (msg: string) => { setNote(msg); setTimeout(() => setNote(''), 5000) }
  const startTimer = () => { if (timerRef.current) clearInterval(timerRef.current); timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000) }
  const stopTimer = () => { if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null } }

  async function transcribe(blob: Blob, filename: string): Promise<string> {
    const fd = new FormData()
    fd.append('file', blob, filename)
    const r = await fetch('/api/transcribe', { method: 'POST', body: fd })
    const d = await r.json()
    if (!r.ok) throw new Error(d.error || '转写失败')
    return d.text || ''
  }

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    e.target.value = ''
    if (!f) return
    const isAudio = f.type.startsWith('audio/') || AUDIO_RE.test(f.name)
    if (isAudio) {
      setTranscribing(true)
      try {
        const text = await transcribe(f, f.name)
        if (text.trim()) setAttached({ name: f.name + '（转写）', content: text })
        else flashNote('音频没识别到内容')
      } catch (err) {
        flashNote(err instanceof Error ? err.message : '音频转写失败')
      }
      setTranscribing(false)
    } else {
      const reader = new FileReader()
      reader.onload = () => setAttached({ name: f.name, content: String(reader.result || '').slice(0, 20000) })
      reader.readAsText(f)
    }
  }

  const startRec = async () => {
    if (typeof window !== 'undefined' && !window.isSecureContext) { flashNote('麦克风需在 HTTPS 或 localhost 下使用'); return }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mr = new MediaRecorder(stream)
      chunksRef.current = []
      mr.ondataavailable = (e) => { if (e.data.size) chunksRef.current.push(e.data) }
      mr.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop())
        stopTimer()
        const blob = new Blob(chunksRef.current, { type: mr.mimeType || 'audio/webm' })
        setRecording(false)
        setPaused(false)
        setTranscribing(true)
        try {
          const text = await transcribe(blob, 'recording.webm')
          if (text.trim()) setValue((v) => (v ? v + ' ' : '') + text)
          else flashNote('没听清，再试一次？')
        } catch (err) {
          flashNote(err instanceof Error ? err.message : '语音转写失败')
        }
        setTranscribing(false)
      }
      recRef.current = mr
      mr.start()
      setElapsed(0)
      setPaused(false)
      setRecording(true)
      startTimer()
    } catch (err) {
      const n = err instanceof Error ? err.name : ''
      if (n === 'NotAllowedError' || n === 'SecurityError') flashNote('麦克风被拒绝：点地址栏左侧🔒图标，把麦克风改成「允许」后重试')
      else if (n === 'NotFoundError' || n === 'DevicesNotFoundError') flashNote('没检测到麦克风设备')
      else if (n === 'NotReadableError') flashNote('麦克风被其他程序占用')
      else flashNote('无法访问麦克风：' + (n || '未知错误'))
    }
  }

  const pauseRec = () => { try { recRef.current?.pause(); setPaused(true); stopTimer() } catch {} }
  const resumeRec = () => { try { recRef.current?.resume(); setPaused(false); startTimer() } catch {} }
  const stopRec = () => { try { recRef.current?.stop() } catch {} }

  const handleSubmit = () => {
    if (disabled) return
    const combined = [value.trim(), attached?.content?.trim()].filter(Boolean).join('\n\n')
    if (!combined) return
    onSubmit(combined)
    setValue('')
    setAttached(null)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') { e.preventDefault(); handleSubmit() }
  }

  const busy = disabled || transcribing || recording
  const canSend = !busy && !!(value.trim() || attached)

  return (
    <>
      <div className="bg-card rounded-3xl shadow-card px-2 py-2 transition-shadow focus-within:shadow-soft">
        {note && <div className="text-[11.5px] text-bad px-3 mb-1">{note}</div>}

        {attached && (
          <div className="flex items-center gap-2 mx-1 mb-1.5 px-3 py-1.5 rounded-2xl text-[12px]" style={{ background: '#f5f8f0' }}>
            <span>📄</span>
            <span className="text-ink truncate flex-1">{attached.name}</span>
            <span className="text-faint shrink-0">{attached.content.length} 字</span>
            <button onClick={() => setAttached(null)} className="text-faint hover:text-bad px-1">✕</button>
          </div>
        )}

        <div className="flex items-center gap-1">
          <button
            onClick={() => fileRef.current?.click()}
            disabled={busy}
            aria-label="上传文本或音频"
            className="shrink-0 w-9 h-9 flex items-center justify-center rounded-full text-sub hover:bg-canvas transition-colors disabled:opacity-40"
            title="上传 .txt/.md 或音频文件（自动转写）"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
            </svg>
          </button>
          <input ref={fileRef} type="file" accept=".txt,.md,.markdown,text/*,audio/*" onChange={handleFile} className="hidden" />

          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={transcribing ? '转写中…' : disabled ? '小当家处理中…' : placeholder}
            disabled={disabled || recording}
            className="flex-1 min-w-0 bg-transparent text-[14px] text-ink outline-none placeholder:text-faint px-1"
          />

          {audioSupported && (
            <button
              onClick={() => !busy && startRec()}
              disabled={busy}
              aria-label="录音转文字"
              className="shrink-0 w-9 h-9 flex items-center justify-center rounded-full transition-colors disabled:opacity-40 text-sub hover:bg-canvas"
              title="录音转文字（适合会议）"
            >
              {transcribing ? (
                <span className="inline-flex gap-0.5">
                  <span className="tdot w-1 h-1 rounded-full inline-block" style={{ background: '#9bb877' }} />
                  <span className="tdot tdot2 w-1 h-1 rounded-full inline-block" style={{ background: '#9bb877' }} />
                  <span className="tdot tdot3 w-1 h-1 rounded-full inline-block" style={{ background: '#9bb877' }} />
                </span>
              ) : (
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="2" width="6" height="12" rx="3" />
                  <path d="M5 10v1a7 7 0 0 0 14 0v-1M12 18v4" />
                </svg>
              )}
            </button>
          )}

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
      </div>

      {/* 录音中弹窗 */}
      {recording && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-5" style={{ background: 'rgba(53,56,47,0.32)', backdropFilter: 'blur(3px)' }}>
          <div className="w-full max-w-xs bg-card rounded-3xl shadow-lift p-6 pop-in text-center">
            <div className="flex items-center justify-center gap-2 mb-3">
              <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: paused ? '#c3c7ba' : '#e07a6a' }} />
              <span className="text-[13px] font-medium" style={{ color: paused ? '#969a8c' : '#e07a6a' }}>
                {paused ? '已暂停' : '正在录音…'}
              </span>
            </div>
            <div className="text-[34px] font-bold text-ink tabular-nums tracking-wider mb-1" style={{ fontVariantNumeric: 'tabular-nums' }}>
              {fmt(elapsed)}
            </div>
            <div className="text-[12px] text-sub mb-5">说完点「完成」，小当家会自动转成文字</div>
            <div className="flex items-center justify-center gap-3">
              {paused ? (
                <button onClick={resumeRec} className="text-[13px] font-medium px-4 py-2.5 rounded-full" style={{ background: '#f0f2eb', color: '#6b8a48' }}>继续</button>
              ) : (
                <button onClick={pauseRec} className="text-[13px] font-medium px-4 py-2.5 rounded-full" style={{ background: '#f0f2eb', color: '#969a8c' }}>暂停</button>
              )}
              <button onClick={stopRec} className="text-[13px] font-medium px-6 py-2.5 rounded-full text-white" style={{ background: '#7d9c57', boxShadow: '0 6px 16px rgba(125,156,87,0.3)' }}>
                完成
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
