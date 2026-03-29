'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

type Item = { href: string; label: string; icon: React.ReactNode }

const ICONS = {
  overview: <path d='M3 12l9-9 9 9M5 10v10h4v-6h6v6h4V10' />,
  sites: <path d='M3 7h18M3 12h18M3 17h18' />,
  prices: <path d='M4 7h16M4 12h16M4 17h10' />,
  reviews: <path d='M21 15a2 2 0 0 1-2 2H8l-4 4V5a2 2 0 0 1 2-2h13a2 2 0 0 1 2 2z' />,
  notices: <path d='M3 11l18-8-3 18-6-5-3 4-1-5z' />,
  health: <path d='M3 12h4l3 8 4-16 3 8h4' />,
}

const ITEMS: Item[] = [
  { href: '/admin', label: '概览', icon: ICONS.overview },
  { href: '/admin/sites', label: '站点', icon: ICONS.sites },
  { href: '/admin/prices', label: '模型价格', icon: ICONS.prices },
  { href: '/admin/reviews', label: '评价', icon: ICONS.reviews },
  { href: '/admin/notices', label: '公告', icon: ICONS.notices },
  { href: '/admin/health', label: '健康度', icon: ICONS.health },
]

function Icon({ children }: { children: React.ReactNode }) {
  return (
    <svg
      width='16'
      height='16'
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='2'
      strokeLinecap='round'
      strokeLinejoin='round'
    >
      {children}
    </svg>
  )
}

function Logo() {
  return (
    <span className='grid h-6 w-6 place-items-center rounded-md bg-gradient-to-br from-brand-500 to-brand-700 text-white'>
      <svg width='12' height='12' viewBox='0 0 24 24' fill='none'>
        <circle cx='12' cy='12' r='8' stroke='currentColor' strokeWidth='2' />
        <circle cx='12' cy='12' r='3' fill='currentColor' />
      </svg>
    </span>
  )
}

export default function AdminNav() {
  const pathname = usePathname()
  const isActive = (href: string) =>
    href === '/admin' ? pathname === '/admin' : pathname.startsWith(href)

  return (
    <>
      {/* desktop sidebar */}
      <aside className='hidden md:flex w-56 shrink-0 flex-col border-r border-stone-200 bg-white sticky top-0 h-screen'>
        <div className='h-14 flex items-center gap-2 px-4 border-b border-stone-200'>
          <Logo />
          <span className='text-sm font-bold text-stone-900'>模镜后台</span>
        </div>
        <nav className='flex-1 p-2 space-y-0.5'>
          {ITEMS.map((it) => {
            const active = isActive(it.href)
            return (
              <Link
                key={it.href}
                href={it.href}
                className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
                  active
                    ? 'bg-brand-50 text-brand-700 font-medium'
                    : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
                }`}
              >
                <Icon>{it.icon}</Icon>
                {it.label}
              </Link>
            )
          })}
        </nav>
        <div className='p-3 border-t border-stone-200'>
          <Link
            href='/'
            className='flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-stone-500 hover:bg-stone-100 hover:text-stone-800'
          >
            ← 返回前台
          </Link>
        </div>
      </aside>

      {/* mobile top nav */}
      <div className='md:hidden sticky top-0 z-40 bg-white border-b border-stone-200'>
        <div className='h-12 flex items-center gap-2 px-3'>
          <Logo />
          <span className='text-sm font-bold text-stone-900'>模镜后台</span>
          <Link href='/' className='ml-auto text-xs text-stone-400'>
            前台 →
          </Link>
        </div>
        <nav className='flex gap-1 px-2 pb-2 overflow-x-auto'>
          {ITEMS.map((it) => {
            const active = isActive(it.href)
            return (
              <Link
                key={it.href}
                href={it.href}
                className={`whitespace-nowrap rounded-md px-2.5 py-1.5 text-xs ${
                  active ? 'bg-brand-50 text-brand-700 font-medium' : 'text-stone-500'
                }`}
              >
                {it.label}
              </Link>
            )
          })}
        </nav>
      </div>
    </>
  )
}
