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

type Phase = 'recording' | 'transcribing' | 'review'

export default function MainInputBox({ onSubmit, disabled }: Props) {
  const [value, setValue] = useState('')
  const [placeholder] = useState(() => PLACEHOLDERS[Math.floor(Math.random() * PLACEHOLDERS.length)])
  const [attached, setAttached] = useState<{ name: string; content: string } | null>(null)
  const [fileBusy, setFileBusy] = useState(false)
  const [note, setNote] = useState('')

  // 录音弹窗
  const [recOpen, setRecOpen] = useState(false)
  const [recMode, setRecMode] = useState<'speech' | 'groq' | null>(null)
  const [phase, setPhase] = useState<Phase>('recording')
  const [paused, setPaused] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [liveText, setLiveText] = useState('')
  const [interim, setInterim] = useState('')
  const [reviewText, setReviewText] = useState('')
  const [audioSupported, setAudioSupported] = useState(false)

  const fileRef = useRef<HTMLInputElement>(null)
  const recognitionRef = useRef<any>(null)
  const recRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const stoppingRef = useRef(false)
  const pausedRef = useRef(false)
  const transcriptRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const SR = typeof window !== 'undefined' && ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)
    const md = typeof window !== 'undefined' && !!navigator.mediaDevices?.getUserMedia && typeof window.MediaRecorder !== 'undefined'
    setAudioSupported(!!SR || md)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      try { recognitionRef.current?.stop() } catch {}
      try { recRef.current?.stream?.getTracks().forEach((t) => t.stop()) } catch {}
    }
  }, [])

  // 实时转写时自动滚到底部
  useEffect(() => {
    if (transcriptRef.current) transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight
  }, [liveText, interim])

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
      setFileBusy(true)
      try {
        const text = await transcribe(f, f.name)
        if (text.trim()) setAttached({ name: f.name + '（转写）', content: text })
        else flashNote('音频没识别到内容')
      } catch (err) {
        flashNote(err instanceof Error ? err.message : '音频转写失败')
      }
      setFileBusy(false)
    } else {
      const reader = new FileReader()
      reader.onload = () => setAttached({ name: f.name, content: String(reader.result || '').slice(0, 20000) })
      reader.readAsText(f)
    }
  }

  const closeRec = () => {
    stoppingRef.current = true
    try { recognitionRef.current?.stop() } catch {}
    try { recRef.current?.stream?.getTracks().forEach((t) => t.stop()) } catch {}
    stopTimer()
    setRecOpen(false)
    setRecMode(null)
    setPhase('recording')
    setLiveText('')
    setInterim('')
    setReviewText('')
    setPaused(false)
  }

  const startRec = async () => {
    if (typeof window !== 'undefined' && !window.isSecureContext) { flashNote('麦克风需在 HTTPS 或 localhost 下使用'); return }
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

    if (SR) {
      // 实时语音识别
      try {
        const rec = new SR()
        rec.lang = 'zh-CN'
        rec.continuous = true
        rec.interimResults = true
        stoppingRef.current = false
        pausedRef.current = false
        rec.onresult = (e: any) => {
          let fin = ''
          let itm = ''
          for (let i = e.resultIndex; i < e.results.length; i++) {
            const r = e.results[i]
            if (r.isFinal) fin += r[0].transcript
            else itm += r[0].transcript
          }
          if (fin) setLiveText((p) => p + fin)
          setInterim(itm)
        }
        rec.onerror = (e: any) => {
          if (e.error === 'not-allowed' || e.error === 'service-not-allowed') { flashNote('麦克风被拒绝：点地址栏左侧🔒图标，把麦克风改成「允许」后重试'); closeRec() }
        }
        rec.onend = () => { if (!stoppingRef.current && !pausedRef.current) { try { rec.start() } catch {} } }
        recognitionRef.current = rec
        setLiveText('')
        setInterim('')
        setElapsed(0)
        setPaused(false)
        setRecMode('speech')
        setPhase('recording')
        setRecOpen(true)
        rec.start()
        startTimer()
      } catch {
        flashNote('无法启动语音识别')
      }
      return
    }

    // 回退：MediaRecorder + Groq 转写
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mr = new MediaRecorder(stream)
      chunksRef.current = []
      mr.ondataavailable = (e) => { if (e.data.size) chunksRef.current.push(e.data) }
      mr.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop())
        stopTimer()
        const blob = new Blob(chunksRef.current, { type: mr.mimeType || 'audio/webm' })
        setPhase('transcribing')
        try {
          const text = await transcribe(blob, 'recording.webm')
          setReviewText(text)
          setPhase('review')
        } catch (err) {
          flashNote(err instanceof Error ? err.message : '语音转写失败')
          closeRec()
        }
      }
      recRef.current = mr
      setElapsed(0)
      setPaused(false)
      setRecMode('groq')
      setPhase('recording')
      setRecOpen(true)
      mr.start()
      startTimer()
    } catch (err) {
      const n = err instanceof Error ? err.name : ''
      if (n === 'NotAllowedError' || n === 'SecurityError') flashNote('麦克风被拒绝：点地址栏左侧🔒图标，把麦克风改成「允许」后重试')
      else if (n === 'NotFoundError' || n === 'DevicesNotFoundError') flashNote('没检测到麦克风设备')
      else flashNote('无法访问麦克风：' + (n || '未知错误'))
    }
  }

  const pauseRec = () => {
    setPaused(true)
    stopTimer()
    if (recMode === 'speech') { pausedRef.current = true; try { recognitionRef.current?.stop() } catch {} }
    else { try { recRef.current?.pause() } catch {} }
  }
  const resumeRec = () => {
    setPaused(false)
    startTimer()
    if (recMode === 'speech') { pausedRef.current = false; try { recognitionRef.current?.start() } catch {} }
    else { try { recRef.current?.resume() } catch {} }
  }
  const finishRec = () => {
    stopTimer()
    if (recMode === 'speech') {
      stoppingRef.current = true
      try { recognitionRef.current?.stop() } catch {}
      const t = (liveText + (interim ? ' ' + interim : '')).trim()
      setReviewText(t)
      setPhase('review')
    } else {
      try { recRef.current?.stop() } catch {} // 触发 onstop → transcribing → review
    }
  }
  const confirmRec = () => {
    const t = reviewText.trim()
    if (t) setValue((v) => (v ? v + ' ' : '') + t)
    closeRec()
  }

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

  const busy = disabled || fileBusy || recOpen
  const canSend = !busy && !!(value.trim() || attached)

  return (
    <>
      <div className="rounded-3xl shadow-card px-2 py-2 transition-shadow focus-within:shadow-soft" style={{ background: '#eef4e6' }}>
        {note && <div className="text-[11.5px] text-bad px-3 mb-1">{note}</div>}

        {attached && (
          <div className="flex items-center gap-2 mx-1 mb-1.5 px-3 py-1.5 rounded-2xl text-[12px]" style={{ background: '#ffffff' }}>
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
            className="shrink-0 w-9 h-9 flex items-center justify-center rounded-full text-sub hover:bg-white transition-colors disabled:opacity-40"
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
            placeholder={fileBusy ? '转写中…' : disabled ? '小当家处理中…' : placeholder}
            disabled={disabled}
            className="flex-1 min-w-0 bg-transparent text-[14px] text-ink outline-none placeholder:text-faint px-1"
          />

          {audioSupported && (
            <button
              onClick={() => !busy && startRec()}
              disabled={busy}
              aria-label="录音转文字"
              className="shrink-0 w-9 h-9 flex items-center justify-center rounded-full transition-colors disabled:opacity-40 text-sub hover:bg-white"
              title="录音转文字（边说边转写）"
            >
              {fileBusy ? (
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
              background: canSend ? '#7d9c57' : '#dfe3d8',
              boxShadow: canSend ? '0 5px 14px rgba(125,156,87,0.30)' : 'none',
              cursor: canSend ? 'pointer' : 'not-allowed',
            }}
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={canSend ? '#ffffff' : '#b3b6a6'} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="7" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </button>
        </div>
      </div>

      {/* 录音弹窗 */}
      {recOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-5" style={{ background: 'rgba(53,56,47,0.32)', backdropFilter: 'blur(3px)' }}>
          <div className="w-full max-w-sm bg-card rounded-3xl shadow-lift p-5 pop-in" style={{ display: 'flex', flexDirection: 'column', maxHeight: '80vh' }}>
            {/* 头部状态 */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                {phase === 'review' ? (
                  <span className="text-[14px] font-semibold text-ink">转写完成，确认一下</span>
                ) : (
                  <>
                    <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: paused ? '#c3c7ba' : '#e07a6a' }} />
                    <span className="text-[13.5px] font-medium" style={{ color: paused ? '#969a8c' : '#e07a6a' }}>
                      {phase === 'transcribing' ? '转写中…' : paused ? '已暂停' : '正在录音…'}
                    </span>
                  </>
                )}
              </div>
              {phase !== 'transcribing' && <span className="text-[14px] font-bold text-ink tabular-nums" style={{ fontVariantNumeric: 'tabular-nums' }}>{fmt(elapsed)}</span>}
            </div>

            {/* 转写内容框（可滚动；review 时可编辑） */}
            {phase === 'review' ? (
              <textarea
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                className="w-full text-[13.5px] text-ink leading-relaxed rounded-2xl p-3 outline-none border-2 border-transparent focus:border-brand resize-none"
                style={{ background: '#f5f8f0', minHeight: 120, maxHeight: '46vh' }}
                autoFocus
              />
            ) : (
              <div ref={transcriptRef} className="rounded-2xl p-3 overflow-y-auto" style={{ background: '#f5f8f0', minHeight: 96, maxHeight: '46vh' }}>
                {liveText || interim ? (
                  <p className="text-[13.5px] leading-relaxed text-ink">
                    {liveText}
                    <span className="text-faint">{interim}</span>
                  </p>
                ) : (
                  <p className="text-[13px] text-faint">{recMode === 'speech' ? '开始说话，文字会实时出现在这里…' : '录音中，说完点「完成」自动转写…'}</p>
                )}
              </div>
            )}

            {/* 控制按钮 */}
            <div className="flex items-center justify-center gap-3 mt-4">
              {phase === 'recording' && (
                <>
                  {paused ? (
                    <button onClick={resumeRec} className="text-[13px] font-medium px-4 py-2.5 rounded-full" style={{ background: '#f0f2eb', color: '#6b8a48' }}>继续</button>
                  ) : (
                    <button onClick={pauseRec} className="text-[13px] font-medium px-4 py-2.5 rounded-full" style={{ background: '#f0f2eb', color: '#969a8c' }}>暂停</button>
                  )}
                  <button onClick={finishRec} className="text-[13px] font-medium px-6 py-2.5 rounded-full text-white" style={{ background: '#7d9c57', boxShadow: '0 6px 16px rgba(125,156,87,0.3)' }}>完成</button>
                </>
              )}
              {phase === 'review' && (
                <>
                  <button onClick={closeRec} className="text-[13px] font-medium px-4 py-2.5 rounded-full" style={{ background: '#f0f2eb', color: '#969a8c' }}>取消</button>
                  <button onClick={confirmRec} disabled={!reviewText.trim()} className="text-[13px] font-medium px-6 py-2.5 rounded-full text-white" style={{ background: reviewText.trim() ? '#7d9c57' : '#c3c7ba', boxShadow: '0 6px 16px rgba(125,156,87,0.3)' }}>用这段文字</button>
                </>
              )}
              {phase === 'transcribing' && (
                <span className="text-[13px] text-sub py-2.5">正在把语音转成文字…</span>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
