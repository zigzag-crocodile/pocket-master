import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// 给所有 /api/* 响应统一加 CORS 头：打包进 App 的 WebView 源是 https://localhost，
// 跨源调用线上 Vercel 后端需要这些头。Web 同源调用带上这些头无害。
const CORS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
}

export function middleware(req: NextRequest) {
  // 预检请求直接返回
  if (req.method === 'OPTIONS') {
    return new NextResponse(null, { status: 204, headers: CORS })
  }
  const res = NextResponse.next()
  for (const [k, v] of Object.entries(CORS)) res.headers.set(k, v)
  return res
}

export const config = { matcher: '/api/:path*' }
