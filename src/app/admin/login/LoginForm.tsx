'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { loginAction } from './actions'

export default function LoginForm({ devMode }: { devMode: boolean }) {
  const [state, formAction] = useActionState(loginAction, null)

  return (
    <div className='min-h-screen grid place-items-center bg-stone-50 px-4'>
      <div className='w-full max-w-sm'>
        <div className='flex items-center justify-center gap-2 mb-6'>
          <span className='grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-sm'>
            <svg width='16' height='16' viewBox='0 0 24 24' fill='none'>
              <circle cx='12' cy='12' r='8' stroke='currentColor' strokeWidth='2' />
              <circle cx='12' cy='12' r='3' fill='currentColor' />
            </svg>
          </span>
          <span className='text-lg font-bold text-stone-900'>模镜 · 后台</span>
        </div>

        <form action={formAction} className='mj-card p-6 space-y-4'>
          <div>
            <label className='mj-label'>管理员密码</label>
            <input
              name='password'
              type='password'
              autoFocus
              placeholder={devMode ? '开发模式 · 任意密码即可' : '请输入密码'}
              className='mj-input'
            />
            {state?.error && <p className='mt-2 text-xs text-red-600'>{state.error}</p>}
          </div>
          <button type='submit' className='mj-btn-primary w-full'>
            进入后台
          </button>
          {devMode && (
            <p className='text-[11px] text-stone-400 leading-relaxed'>
              提示：当前未设置 <code className='text-stone-500'>ADMIN_PASSWORD</code>，
              后台处于开发开放模式。生产部署请配置该环境变量。
            </p>
          )}
        </form>

        <div className='mt-4 text-center'>
          <Link href='/' className='text-sm text-stone-400 hover:text-brand-700'>
            ← 返回前台
          </Link>
        </div>
      </div>
    </div>
  )
}
