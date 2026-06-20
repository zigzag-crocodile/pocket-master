'use client'
import { useState, useEffect } from 'react'
import Dashboard from '@/components/Dashboard'
import CharacterAvatar from '@/components/CharacterAvatar'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'

export default function Home() {
  const supaOn = isSupabaseConfigured()
  const [sessionEmail, setSessionEmail] = useState<string | null>(null)
  const [checking, setChecking] = useState(true)
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  // 访问埋点（每次进入上报一次）
  useEffect(() => {
    try {
      let sid = localStorage.getItem('pm_sid')
      if (!sid) { sid = Math.random().toString(36).slice(2) + Date.now().toString(36); localStorage.setItem('pm_sid', sid) }
      fetch('/api/track', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ path: location.pathname, sessionId: sid }) }).catch(() => {})
    } catch {}
  }, [])

  // 检查已有会话（仅 Supabase 模式）
  useEffect(() => {
    if (!supaOn || !supabase) {
      setChecking(false)
      return
    }
    supabase.auth.getSession().then(({ data }) => {
      setSessionEmail(data.session?.user?.email ?? null)
      setChecking(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setSessionEmail(session?.user?.email ?? null)
    })
    return () => sub.subscription.unsubscribe()
  }, [supaOn])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setNotice('')
    if (!email.trim()) {
      setError('请输入邮箱')
      return
    }

    // Demo 模式：未配置 Supabase，任意邮箱直接进入
    if (!supaOn || !supabase) {
      await new Promise((r) => setTimeout(r, 400))
      setSessionEmail(email.trim())
      return
    }

    if (!password) {
      setError('请输入密码')
      return
    }
    setLoading(true)
    try {
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({ email: email.trim(), password })
        if (error) throw error
        if (!data.session) {
          setNotice('注册成功！如开启了邮箱验证，请到邮箱点确认链接后再登录。')
          setMode('signin')
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
        if (error) throw error
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '操作失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    if (supabase) await supabase.auth.signOut()
    setSessionEmail(null)
    setEmail('')
    setPassword('')
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-sub text-[13px]">载入中…</div>
      </div>
    )
  }

  if (sessionEmail) return <Dashboard userEmail={sessionEmail} onSignOut={handleSignOut} />

  return (
    <div className="min-h-screen flex items-center justify-center px-5 bg-white">
      <div className="w-full max-w-xs">
        {/* mascot + brand */}
        <div className="flex flex-col items-center mb-7">
          <div className="bg-card rounded-3xl shadow-soft p-2 mb-1">
            <CharacterAvatar status="idle" size={180} />
          </div>
          <div className="text-[20px] font-bold text-ink mt-2 tracking-tight">随身小当家</div>
          <div className="text-[12.5px] text-sub mt-1">My Pocket Master · 你的口袋 AI 助手</div>
        </div>

        {/* login card */}
        <div className="bg-card rounded-3xl shadow-soft p-6">
          {supaOn && (
            <div className="flex gap-1 p-1 mb-4 rounded-full" style={{ background: '#f0f2eb' }}>
              {(['signin', 'signup'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => { setMode(m); setError(''); setNotice('') }}
                  className="flex-1 text-[12.5px] font-medium py-1.5 rounded-full transition-all"
                  style={{
                    background: mode === m ? '#ffffff' : 'transparent',
                    color: mode === m ? '#6b8a48' : '#969a8c',
                    boxShadow: mode === m ? '0 1px 4px rgba(53,56,47,0.08)' : 'none',
                  }}
                >
                  {m === 'signin' ? '登录' : '注册'}
                </button>
              ))}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <div className="text-[12.5px] text-sub mb-1.5 ml-1">邮箱</div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full px-4 py-3 text-[14px] rounded-2xl bg-canvas text-ink outline-none border-2 border-transparent focus:border-brand transition-colors placeholder:text-faint"
              />
            </div>
            <div>
              <div className="text-[12.5px] text-sub mb-1.5 ml-1">密码{!supaOn && '（Demo 模式可留空）'}</div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="请输入密码"
                  autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                  className="w-full pl-4 pr-11 py-3 text-[14px] rounded-2xl bg-canvas text-ink outline-none border-2 border-transparent focus:border-brand transition-colors placeholder:text-faint"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? '隐藏密码' : '显示密码'}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full text-sub hover:text-ink"
                >
                  {showPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" /><circle cx="12" cy="12" r="3" /></svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                  )}
                </button>
              </div>
            </div>
            {error && <div className="text-bad text-[12.5px] ml-1">{error}</div>}
            {notice && <div className="text-[12.5px] ml-1" style={{ color: '#6b8a48' }}>{notice}</div>}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 text-[14px] font-medium rounded-2xl text-white transition-all"
              style={{ background: '#7d9c57', boxShadow: '0 8px 22px rgba(125,156,87,0.32)', opacity: loading ? 0.7 : 1 }}
            >
              {loading ? '处理中…' : supaOn ? (mode === 'signin' ? '登录' : '注册') : '登录'}
            </button>
          </form>
          <div className="text-[12px] text-faint mt-4 text-center">
            {supaOn ? '已接入 Supabase · 真实账号' : 'Demo · 任意邮箱即可登录'}
          </div>
        </div>
      </div>
    </div>
  )
}
