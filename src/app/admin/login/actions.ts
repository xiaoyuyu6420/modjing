'use server'

import { redirect } from 'next/navigation'
import { isAdminEnabled, setSessionCookie, verifyPassword } from '@/lib/admin-auth'

export type LoginState = { error?: string } | null

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const pw = String(formData.get('password') ?? '')
  if (!isAdminEnabled()) {
    // dev mode — no password needed, but still issue a session cookie
    await setSessionCookie()
    redirect('/admin')
  }
  if (!verifyPassword(pw)) {
    return { error: '密码错误' }
  }
  await setSessionCookie()
  redirect('/admin')
}
