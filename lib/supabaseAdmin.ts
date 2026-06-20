import { createClient } from '@supabase/supabase-js'

// 仅服务端使用：service role 绕过 RLS，可读全站数据。切勿在前端引入。
const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

export const supabaseAdmin = url && serviceKey
  ? createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } })
  : null

// 允许访问后台的管理员邮箱（逗号分隔），在 .env 配置 ADMIN_EMAIL
const ADMIN_EMAILS = (process.env.ADMIN_EMAIL || '').split(',').map((s) => s.trim().toLowerCase()).filter(Boolean)

export function isAdminEmail(email?: string | null): boolean {
  if (!email) return false
  // 未配置 ADMIN_EMAIL 时一律拒绝（安全优先）
  if (ADMIN_EMAILS.length === 0) return false
  return ADMIN_EMAILS.includes(email.toLowerCase())
}

export const adminConfigured = ADMIN_EMAILS.length > 0
