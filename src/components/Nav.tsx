'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useRef, useEffect } from 'react'

type NavItem = {
  href: string
  label: string
  badge?: string
}

/* 14 个导航项保留，标签更精炼有力 */
const NAV_ITEMS: NavItem[] = [
  { href: '/', label: '首页' },
  { href: '/sites', label: '站点' },
  { href: '/models', label: '模型' },
  { href: '/leaderboard', label: '排行' },
  { href: '/model-select', label: '择优' },
  { href: '/enterprise', label: '合规', badge: 'NEW' },
  { href: '/rp', label: 'RP' },
  { href: '/benchmark', label: '测速' },
  { href: '/notices', label: '公告' },
  { href: '/codex-radar', label: '雷达' },
  { href: '/plans', label: '比价' },
  { href: '/methodology', label: '方法', badge: 'NEW' },
  { href: '/free', label: '公益' },
  { href: '/consult', label: '咨询' },
]

function Logo() {
  return (
    <Link href='/' className='flex items-center gap-2.5 group shrink-0'>
      <div className='relative w-9 h-9 flex items-center justify-center'>
        <div className='absolute inset-0 rounded-xl bg-gradient-to-tr from-brand-400 to-emerald-200 opacity-20 group-hover:opacity-40 blur-md transition-opacity duration-500' />
        <svg
          className='relative z-10 w-8 h-8 text-brand-600 transition-transform duration-700 group-hover:scale-110 group-hover:rotate-12'
          viewBox='0 0 32 32'
          fill='none'
          stroke='currentColor'
          strokeWidth='1.8'
          strokeLinecap='round'
          strokeLinejoin='round'
        >
          <polygon points='16,2 30,9 30,23 16,30 2,23 2,9' stroke='currentColor' fill='rgba(16,185,129,0.05)' />
          <polygon points='16,8 24,12 24,20 16,24 8,20 8,12' stroke='currentColor' fill='rgba(16,185,129,0.15)' />
          <line x1='16' y1='2' x2='16' y2='8' />
          <line x1='30' y1='9' x2='24' y2='12' />
          <line x1='30' y1='23' x2='24' y2='20' />
          <line x1='16' y1='30' x2='16' y2='24' />
          <line x1='2' y1='23' x2='8' y2='20' />
          <line x1='2' y1='9' x2='8' y2='12' />
          <circle cx='16' cy='16' r='2' fill='#059669' stroke='none' />
        </svg>
      </div>
      <span className='text-[19px] font-extrabold text-stone-900 tracking-tight'>Modjing</span>
    </Link>
  )
}

export default function Nav() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const navRef = useRef<HTMLElement>(null)
  const [indicator, setIndicator] = useState({ left: 0, width: 0, opacity: 0 })
  const [activeHref, setActiveHref] = useState<string | null>(null)

  /* 在客户端计算 active 项，避免 SSR/CSR 的 pathname 不一致导致 hydration mismatch */
  useEffect(() => {
    if (!pathname) return
    const active = NAV_ITEMS.find((item) =>
      item.href === '/' ? pathname === '/' : pathname.startsWith(item.href),
    )
    setActiveHref(active?.href ?? null)
  }, [pathname])

  /* 根据 active 项计算 indicator 位置 */
  useEffect(() => {
    if (!navRef.current || !activeHref) {
      setIndicator((i) => ({ ...i, opacity: 0 }))
      return
    }
    const activeLink = navRef.current.querySelector<HTMLElement>('[data-active="true"]')
    if (activeLink) {
      const parent = navRef.current.getBoundingClientRect()
      const rect = activeLink.getBoundingClientRect()
      setIndicator({
        left: rect.left - parent.left,
        width: rect.width,
        opacity: 1,
      })
    }
  }, [activeHref])

  const isActive = (href: string) => activeHref === href

  return (
    <header className='sticky top-0 z-50 glass-nav spring-enter' style={{ animationDelay: '0s' }}>
      <div className='max-w-[100rem] mx-auto px-6 xl:px-8'>
        <div className='flex items-center justify-between h-[60px] py-2.5 gap-4'>
          <Logo />

          {/* 桌面导航 — 14 项，紧凑排列 */}
          <nav
            ref={navRef}
            className='hidden xl:flex flex-1 items-center justify-center gap-1 relative'
          >
            {activeHref && (
              <div
                className='absolute bottom-0 h-[2px] bg-brand-500 rounded-full transition-all duration-300 ease-out pointer-events-none'
                style={{
                  left: indicator.left,
                  width: indicator.width,
                  opacity: indicator.opacity,
                  boxShadow: '0 0 8px rgba(16,185,129,0.5)',
                }}
              />
            )}
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                data-active={isActive(item.href) ? 'true' : 'false'}
                className={`nav-glow relative px-2.5 py-1.5 text-[13px] rounded-md whitespace-nowrap transition-all duration-200 ${
                  isActive(item.href)
                    ? 'nav-glow active'
                    : 'text-stone-500 hover:text-brand-600'
                }`}
              >
                {item.label}
                {item.badge && (
                  <span className='absolute -top-1.5 -right-1 text-[9px] font-bold bg-brand-500 text-white px-1 py-0.5 rounded shadow-sm scale-75 origin-bottom-left'>
                    {item.badge}
                  </span>
                )}
              </Link>
            ))}
          </nav>

          {/* 右侧登录按钮 */}
          <div className='hidden md:flex shrink-0'>
            <a
              href='/admin'
              className='text-[13px] font-semibold text-white bg-gradient-to-b from-stone-800 to-stone-900 hover:from-brand-500 hover:to-brand-600 border border-stone-700 hover:border-brand-400 transition-all flex items-center gap-1.5 px-4 py-2 rounded-lg shadow-[0_4px_12px_-2px_rgba(0,0,0,0.2),inset_0_1px_1px_rgba(255,255,255,0.1)] hover:shadow-[0_8px_20px_-4px_rgba(16,185,129,0.3),inset_0_1px_1px_rgba(255,255,255,0.2)]'
            >
              登录
              <svg className='w-3.5 h-3.5' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.5'>
                <path d='M5 12h14M12 5l7 7-7 7' />
              </svg>
            </a>
          </div>

          {/* 移动端菜单按钮 */}
          <button
            onClick={() => setOpen(!open)}
            className='xl:hidden p-2 -mr-2 text-stone-600 hover:text-stone-900'
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

        {/* 移动端导航 — 保持 grid-cols-2 */}
        {open && (
          <nav className='xl:hidden pb-4 grid grid-cols-2 gap-1'>
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`px-3 py-2.5 text-sm rounded-lg transition-all ${
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
