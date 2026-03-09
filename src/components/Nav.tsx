'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

type NavItem = {
  href: string
  label: string
  badge?: string
}

const NAV_ITEMS: NavItem[] = [
  { href: '/', label: '首页' },
  { href: '/sites', label: '站点' },
  { href: '/models', label: '模型' },
  { href: '/leaderboard', label: '排行' },
  { href: '/model-select', label: '模型择优' },
  { href: '/enterprise', label: '企业合规', badge: 'NEW' },
  { href: '/rp', label: 'RP 专区' },
  { href: '/benchmark', label: '测速' },
  { href: '/notices', label: '公告' },
  { href: '/codex-radar', label: 'Codex 雷达' },
  { href: '/plans', label: '套餐对比' },
  { href: '/methodology', label: '方法论', badge: 'NEW' },
  { href: '/free', label: '公益站' },
  { href: '/consult', label: '咨询' },
]

function Logo() {
  return (
    <Link href='/' className='flex items-center gap-2 shrink-0'>
      <span className='grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-sm'>
        <svg width='14' height='14' viewBox='0 0 24 24' fill='none'>
          <circle cx='12' cy='12' r='8' stroke='currentColor' strokeWidth='2' />
          <circle cx='12' cy='12' r='3' fill='currentColor' />
        </svg>
      </span>
      <span className='flex items-baseline gap-1.5'>
        <span className='text-[17px] font-bold tracking-tight text-stone-900'>模镜</span>
        <span className='text-xs text-stone-400'>· Miro</span>
      </span>
    </Link>
  )
}

export default function Nav() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href)

  return (
    <header className='sticky top-0 z-50 bg-stone-50/85 backdrop-blur-md border-b border-stone-200/80'>
      <div className='max-w-7xl mx-auto px-4'>
        <div className='flex items-center justify-between h-15 py-2.5'>
          <Logo />

          <nav className='hidden lg:flex items-center gap-0.5 overflow-x-auto'>
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`relative px-2.5 py-1.5 text-[13px] rounded-md transition-colors whitespace-nowrap ${
                  isActive(item.href)
                    ? 'text-brand-700 bg-brand-50 font-medium'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                }`}
              >
                {item.label}
                {item.badge && (
                  <span className='ml-1 inline-block px-1 py-0.5 text-[9px] font-bold rounded bg-brand-600 text-white align-top'>
                    {item.badge}
                  </span>
                )}
              </Link>
            ))}
          </nav>

          <button
            onClick={() => setOpen(!open)}
            className='lg:hidden p-2 -mr-2 text-stone-600 hover:text-stone-900'
            aria-label='菜单'
          >
            <svg width='20' height='20' viewBox='0 0 20 20' fill='none'>
              {open ? (
                <path d='M4 4l12 12M16 4L4 16' stroke='currentColor' strokeWidth='2' strokeLinecap='round' />
              ) : (
                <path d='M3 5h14M3 10h14M3 15h14' stroke='currentColor' strokeWidth='2' strokeLinecap='round' />
              )}
            </svg>
          </button>
        </div>

        {open && (
          <nav className='lg:hidden pb-3 grid grid-cols-2 gap-0.5'>
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`px-3 py-2 text-sm rounded-md ${
                  isActive(item.href)
                    ? 'text-brand-700 bg-brand-50 font-medium'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                }`}
              >
                {item.label}
                {item.badge && (
                  <span className='ml-1 px-1 py-0.5 text-[9px] font-bold rounded bg-brand-600 text-white'>
                    {item.badge}
                  </span>
                )}
              </Link>
            ))}
          </nav>
        )}
      </div>
    </header>
  )
}
