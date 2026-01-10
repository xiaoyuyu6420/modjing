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

export default function Nav() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href)

  return (
    <header className='sticky top-0 z-50 bg-gray-950/90 backdrop-blur border-b border-gray-800'>
      <div className='max-w-7xl mx-auto px-4'>
        <div className='flex items-center justify-between h-14'>
          <Link href='/' className='flex items-center gap-2 shrink-0'>
            <span className='text-lg font-bold text-gray-100'>模镜</span>
            <span className='text-sm text-gray-500'>· Miro</span>
          </Link>

          <nav className='hidden lg:flex items-center gap-1 overflow-x-auto'>
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`relative px-3 py-1.5 text-sm rounded-md transition-colors whitespace-nowrap ${
                  isActive(item.href)
                    ? 'bg-gray-800 text-gray-100'
                    : 'text-gray-400 hover:text-gray-100 hover:bg-gray-900'
                }`}
              >
                {item.label}
                {item.badge && (
                  <span className='ml-1 inline-block px-1 py-0.5 text-[10px] font-bold rounded bg-blue-600 text-white align-top'>
                    {item.badge}
                  </span>
                )}
              </Link>
            ))}
          </nav>

          <button
            onClick={() => setOpen(!open)}
            className='lg:hidden p-2 text-gray-400 hover:text-gray-100'
            aria-label='菜单'
          >
            <svg width='20' height='20' viewBox='0 0 20 20' fill='currentColor'>
              {open ? (
                <path d='M4 4l12 12M16 4L4 16' stroke='currentColor' strokeWidth='2' />
              ) : (
                <path d='M3 5h14M3 10h14M3 15h14' stroke='currentColor' strokeWidth='2' />
              )}
            </svg>
          </button>
        </div>

        {open && (
          <nav className='lg:hidden pb-3 grid grid-cols-2 gap-1'>
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`px-3 py-2 text-sm rounded-md ${
                  isActive(item.href)
                    ? 'bg-gray-800 text-gray-100'
                    : 'text-gray-400 hover:text-gray-100 hover:bg-gray-900'
                }`}
              >
                {item.label}
                {item.badge && (
                  <span className='ml-1 px-1 py-0.5 text-[10px] font-bold rounded bg-blue-600 text-white'>
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
