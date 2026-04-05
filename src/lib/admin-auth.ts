import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import crypto from 'node:crypto'

/*
 * 轻量后台门禁
 * - 未设置 ADMIN_PASSWORD 时视为开发模式，放行（页面会显示警告）
 * - 设置后，必须用密码换得签名 cookie 才能访问 /admin/*
 * 注：在 Server Component / Server Action（Node runtime）中运行，无需 edge crypto
 */

const COOKIE = 'mj_admin'
const SECRET = process.env.ADMIN_SECRET || 'modjing-dev-secret-change-me'

export function isAdminEnabled() {
  return !!process.env.ADMIN_PASSWORD
}

export function verifyPassword(pw: string) {
  const expected = process.env.ADMIN_PASSWORD
  if (!expected) return true
  const a = Buffer.from(pw)
  const b = Buffer.from(expected)
  return a.length === b.length && crypto.timingSafeEqual(a, b)
}

function sign(payload: string) {
  return crypto.createHmac('sha256', SECRET).update(payload).digest('hex')
}

export function createSessionToken() {
  const payload = `admin.${Date.now()}`
  return `${payload}.${sign(payload)}`
}

export function verifySessionToken(token: string | undefined) {
  if (!token) return false
  const idx = token.lastIndexOf('.')
  if (idx < 0) return false
  const payload = token.slice(0, idx)
  const sig = token.slice(idx + 1)
  const expected = sign(payload)
  const a = Buffer.from(sig)
  const b = Buffer.from(expected)
  return a.length === b.length && crypto.timingSafeEqual(a, b)
}

export async function requireAdmin() {
  if (!isAdminEnabled()) return { enabled: false }
  const store = await cookies()
  const token = store.get(COOKIE)?.value
  if (!verifySessionToken(token)) {
    redirect('/admin/login')
  }
  return { enabled: true }
}

export async function setSessionCookie() {
  const store = await cookies()
  store.set(COOKIE, createSessionToken(), {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  })
}
