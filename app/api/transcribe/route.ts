import { NextRequest, NextResponse } from 'next/server'

// 语音转写：OpenAI 兼容 /audio/transcriptions（默认 Groq Whisper）
const STT_API_KEY = process.env.STT_API_KEY || ''
const STT_MODEL = process.env.STT_MODEL || 'whisper-large-v3-turbo'
const STT_BASE_URL = (process.env.STT_BASE_URL || 'https://api.groq.com/openai/v1').replace(/\/+$/, '')

export async function POST(req: NextRequest) {
  if (!STT_API_KEY) {
    return NextResponse.json({ error: 'STT 未配置：请在 .env 设置 STT_API_KEY' }, { status: 400 })
  }

  let file: File | null = null
  try {
    const form = await req.formData()
    file = form.get('file') as File | null
  } catch {
    return NextResponse.json({ error: '无法解析上传的音频' }, { status: 400 })
  }
  if (!file) {
    return NextResponse.json({ error: '缺少音频文件' }, { status: 400 })
  }

  try {
    const bytes = await file.arrayBuffer()
    const extMap: Record<string, string> = { webm: 'audio/webm', wav: 'audio/wav', mp3: 'audio/mpeg', m4a: 'audio/mp4', mp4: 'audio/mp4', ogg: 'audio/ogg', flac: 'audio/flac', mpeg: 'audio/mpeg', mpga: 'audio/mpeg' }
    let name = file.name || 'audio.webm'
    if (!/\.[a-z0-9]+$/i.test(name)) name += '.webm'
    const ext = name.split('.').pop()!.toLowerCase()
    const type = file.type || extMap[ext] || 'audio/webm'

    // 用 undici 的 fetch + FormData 转发；本地若有代理(HTTPS_PROXY)则走代理
    // （Groq 封锁部分地区直连 IP；Vercel 等海外环境无需代理直连即可）
    const { fetch: undiciFetch, FormData: UndiciFormData, ProxyAgent } = await import('undici')
    const out = new UndiciFormData()
    out.append('model', STT_MODEL)
    out.append('file', new Blob([bytes], { type }), name)
    out.append('response_format', 'json')

    const proxy = process.env.STT_PROXY || process.env.HTTPS_PROXY || process.env.HTTP_PROXY
    const res = await undiciFetch(`${STT_BASE_URL}/audio/transcriptions`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${STT_API_KEY}` },
      body: out as any,
      signal: AbortSignal.timeout(60000),
      ...(proxy ? { dispatcher: new ProxyAgent(proxy) } : {}),
    })

    if (!res.ok) {
      const body = await res.text().catch(() => '')
      return NextResponse.json({ error: `转写失败 ${res.status} ${body.slice(0, 200)}` }, { status: 502 })
    }

    const data = (await res.json()) as { text?: string }
    return NextResponse.json({ text: data.text || '' })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : '转写请求异常' }, { status: 500 })
  }
}
