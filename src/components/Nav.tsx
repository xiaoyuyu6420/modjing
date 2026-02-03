'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useRef, useEffect } from 'react'

type NavItem = {
  href: string
  label: string
  badge?: string
}

type NavGroup = {
  label: string
  items: NavItem[]
}

const PRIMARY_NAV: NavItem[] = [
  { href: '/', label: '首页' },
  { href: '/sites', label: '站点' },
  { href: '/models', label: '模型' },
  { href: '/leaderboard', label: '排行榜' },
  { href: '/benchmark', label: '测速' },
  { href: '/enterprise', label: '企业合规', badge: 'NEW' },
]

const NAV_GROUPS: NavGroup[] = [
  {
    label: '工具',
    items: [
      { href: '/model-select', label: '模型择优' },
      { href: '/plans', label: '套餐对比' },
      { href: '/free', label: '公益站' },
    ],
  },
  {
    label: '资讯',
    items: [
      { href: '/notices', label: '站点公告' },
      { href: '/codex-radar', label: 'Codex 雷达' },
      { href: '/rp', label: 'RP 专区' },
    ],
  },
  {
    label: '关于',
    items: [
      { href: '/methodology', label: '方法论', badge: 'NEW' },
      { href: '/consult', label: '咨询服务' },
      { href: '/contact', label: '联系我们' },
    ],
  },
]

function Dropdown({ group, pathname }: { group: NavGroup; pathname: string }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const isActive = group.items.some((item) =>
    item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)
  )

  return (
    <div ref={ref} className='relative'>
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg transition-colors ${
          isActive
            ? 'bg-gray-800 text-gray-100'
            : 'text-gray-400 hover:text-gray-100 hover:bg-gray-900'
        }`}
      >
        {group.label}
        <svg className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2}>
          <path strokeLinecap='round' strokeLinejoin='round' d='M19.5 8.25l-7.5 7.5-7.5-7.5' />
        </svg>
      </button>

      {open && (
        <div className='absolute top-full left-0 mt-1 py-1 w-44 glass-card rounded-xl shadow-xl shadow-black/30 border border-gray-700/50 z-50'>
          {group.items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={`flex items-center justify-between px-4 py-2 text-sm transition-colors ${
                pathname.startsWith(item.href)
                  ? 'bg-gray-800 text-gray-100'
                  : 'text-gray-400 hover:text-gray-100 hover:bg-gray-800/50'
              }`}
            >
              <span>{item.label}</span>
              {item.badge && (
                <span className='px-1.5 py-0.5 text-[10px] font-bold rounded bg-blue-600 text-white'>
                  {item.badge}
                </span>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

export default function Nav() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href)

  return (
    <header className='sticky top-0 z-50 bg-gray-950/80 backdrop-blur-xl border-b border-gray-800/50'>
      <div className='max-w-7xl mx-auto px-4'>
        <div className='flex items-center justify-between h-14'>
          <Link href='/' className='flex items-center gap-2.5 shrink-0 group'>
            <div className='w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold'>
              M
            </div>
            <span className='text-base font-bold text-gray-100 group-hover:text-white transition-colors'>模镜</span>
          </Link>

          {/* Desktop nav */}
          <nav className='hidden lg:flex items-center gap-1'>
            {PRIMARY_NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`relative px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  isActive(item.href)
                    ? 'bg-gray-800 text-gray-100'
                    : 'text-gray-400 hover:text-gray-100 hover:bg-gray-900'
                }`}
              >
                {item.label}
                {item.badge && (
                  <span className='ml-1.5 inline-block px-1.5 py-0.5 text-[10px] font-bold rounded bg-blue-600 text-white align-top'>
                    {item.badge}
                  </span>
                )}
              </Link>
            ))}

            <div className='w-px h-5 bg-gray-800 mx-1' />

            {NAV_GROUPS.map((group) => (
              <Dropdown key={group.label} group={group} pathname={pathname} />
            ))}
          </nav>

          {/* Mobile hamburger */}
          <button
            onClick={() => setOpen(!open)}
            className='lg:hidden p-2 text-gray-400 hover:text-gray-100 rounded-lg hover:bg-gray-900 transition-colors'
            aria-label='菜单'
          >
            <svg width='20' height='20' viewBox='0 0 20 20' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round'>
              {open ? (
                <>
                  <path d='M5 5l10 10' />
                  <path d='M15 5L5 15' />
                </>
              ) : (
                <>
                  <path d='M3 6h14' />
                  <path d='M3 10h14' />
                  <path d='M3 14h14' />
                </>
              )}
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {open && (
          <nav className='lg:hidden pb-4 space-y-3'>
            {/* Primary items */}
            <div className='grid grid-cols-3 gap-1'>
              {PRIMARY_NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={`px-3 py-2 text-sm rounded-lg text-center ${
                    isActive(item.href)
                      ? 'bg-gray-800 text-gray-100'
                      : 'text-gray-400 hover:text-gray-100 hover:bg-gray-900'
                  }`}
                >
                  {item.label}
                  {item.badge && (
                    <span className='ml-1 px-1 py-0.5 text-[9px] font-bold rounded bg-blue-600 text-white'>
                      {item.badge}
                    </span>
                  )}
                </Link>
              ))}
            </div>

            {/* Groups */}
            {NAV_GROUPS.map((group) => (
              <div key={group.label}>
                <div className='text-xs text-gray-500 font-medium px-3 mb-1'>{group.label}</div>
                <div className='grid grid-cols-3 gap-1'>
                  {group.items.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className={`px-3 py-2 text-sm rounded-lg text-center ${
                        isActive(item.href)
                          ? 'bg-gray-800 text-gray-100'
                          : 'text-gray-400 hover:text-gray-100 hover:bg-gray-900'
                      }`}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </nav>
        )}
      </div>
    </header>
  )
}
