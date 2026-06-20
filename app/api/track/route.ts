import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

// 访问埋点：客户端进入时上报一次。fire-and-forget，失败也不影响 app。
export async function POST(req: NextRequest) {
  if (!supabaseAdmin) return NextResponse.json({ ok: false })
  try {
    const { path, sessionId, email } = await req.json()
    await supabaseAdmin.from('visits').insert({
      path: String(path || '/').slice(0, 200),
      session_id: String(sessionId || '').slice(0, 64),
      user_email: email ? String(email).slice(0, 200) : null,
    })
  } catch {}
  return NextResponse.json({ ok: true })
}
