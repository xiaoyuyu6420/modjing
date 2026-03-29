import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { StatusBadge } from '@/components/ui/StatusBadge'

export const dynamic = 'force-dynamic'

export default async function AdminDashboard() {
  const [
    statusCounts,
    totalSites,
    totalPrices,
    anomalyCount,
    tamperedCount,
    totalReviews,
    totalNotices,
    recentReviews,
    recentNotices,
    recentSites,
  ] = await Promise.all([
    prisma.site.groupBy({ by: ['status'], _count: true }),
    prisma.site.count(),
    prisma.siteModelPrice.count(),
    prisma.siteModelPrice.count({ where: { priceAnomaly: true } }),
    prisma.siteModelPrice.count({ where: { tampered: true } }),
    prisma.review.count(),
    prisma.relayNotice.count(),
    prisma.review.findMany({ take: 5, orderBy: { createdAt: 'desc' }, include: { site: true } }),
    prisma.relayNotice.findMany({
      take: 5,
      orderBy: { fetchedAt: 'desc' },
      include: { site: true },
    }),
    prisma.site.findMany({ take: 5, orderBy: { createdAt: 'desc' } }),
  ])

  const count = (s: string) =>
    statusCounts.find((x) => x.status === s)?._count ?? 0
  const online = count('online')
  const unstable = count('unstable')
  const offline = count('offline')

  return (
    <div className='space-y-8'>
      <div>
        <h1 className='text-2xl font-bold tracking-tight'>后台概览</h1>
        <p className='text-sm text-stone-500 mt-1'>模镜全部内容的实时统计与管理入口。</p>
      </div>

      <div className='grid grid-cols-2 md:grid-cols-4 gap-3'>
        <Stat label='中转站' value={totalSites} hint={`${online} 在线 · ${offline} 离线`} href='/admin/sites' />
        <Stat label='价格条目' value={totalPrices} hint={`${anomalyCount} 价格异常`} href='/admin/prices' />
        <Stat label='掺水标记' value={tamperedCount} hint='已掺水渠道' accent='text-red-600' href='/admin/prices' />
        <Stat label='评价 / 公告' value={`${totalReviews}/${totalNotices}`} href='/admin/reviews' />
      </div>

      <div className='grid md:grid-cols-3 gap-3'>
        <StatusPill label='在线' value={online} tone='brand' />
        <StatusPill label='不稳定' value={unstable} tone='amber' />
        <StatusPill label='离线' value={offline} tone='red' />
      </div>

      <div className='grid lg:grid-cols-2 gap-6'>
        <Panel title='最新收录站点' href='/admin/sites'>
          {recentSites.length === 0 ? (
            <Empty>暂无站点</Empty>
          ) : (
            <ul className='divide-y divide-stone-100'>
              {recentSites.map((s) => (
                <li key={s.id} className='flex items-center justify-between py-2.5'>
                  <div className='min-w-0'>
                    <Link href={`/admin/sites/${s.id}`} className='font-medium text-stone-900 hover:text-brand-700 truncate'>
                      {s.name}
                    </Link>
                    <div className='text-xs text-stone-400 truncate'>{s.url}</div>
                  </div>
                  <div className='flex items-center gap-2 shrink-0'>
                    <StatusBadge status={s.status} />
                    <span className='text-xs text-stone-400 mj-mono'>
                      {new Date(s.createdAt).toLocaleDateString('zh-CN')}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title='最新评价' href='/admin/reviews'>
          {recentReviews.length === 0 ? (
            <Empty>暂无评价</Empty>
          ) : (
            <ul className='divide-y divide-stone-100'>
              {recentReviews.map((r) => (
                <li key={r.id} className='py-2.5'>
                  <div className='flex items-center justify-between'>
                    <span className='text-sm font-medium text-stone-900'>{r.author}</span>
                    <span className='text-amber-500 text-xs mj-mono'>★{r.rating}</span>
                  </div>
                  <p className='text-sm text-stone-500 truncate'>{r.content}</p>
                  <div className='text-xs text-stone-400 mt-0.5'>
                    @ {(r.site?.name ?? '未知站点')}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title='最新公告' href='/admin/notices' className='lg:col-span-2'>
          {recentNotices.length === 0 ? (
            <Empty>暂无公告</Empty>
          ) : (
            <ul className='divide-y divide-stone-100'>
              {recentNotices.map((n) => (
                <li key={n.id} className='py-2.5 flex items-start justify-between gap-3'>
                  <div className='min-w-0'>
                    <p className='text-sm text-stone-700 line-clamp-1'>{n.noticeText}</p>
                    <div className='text-xs text-stone-400 mt-0.5'>
                      @{n.site?.name ?? '未知'} · {n.tagCategory}
                    </div>
                  </div>
                  <span className='text-xs text-stone-400 mj-mono shrink-0'>
                    {new Date(n.fetchedAt).toLocaleDateString('zh-CN')}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  )
}

function Stat({
  label,
  value,
  hint,
  accent,
  href,
}: {
  label: string
  value: number | string
  hint?: string
  accent?: string
  href?: string
}) {
  const inner = (
    <>
      <div className='text-xs text-stone-500'>{label}</div>
      <div className={`text-2xl font-bold mt-1 mj-mono ${accent ?? 'text-stone-900'}`}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </div>
      {hint && <div className='text-[11px] text-stone-400 mt-0.5'>{hint}</div>}
    </>
  )
  return href ? (
    <Link href={href} className='mj-card mj-card-hover p-4 block'>
      {inner}
    </Link>
  ) : (
    <div className='mj-card p-4'>{inner}</div>
  )
}

const TONES: Record<string, string> = {
  brand: 'border-brand-200 bg-brand-50 text-brand-700',
  amber: 'border-amber-200 bg-amber-50 text-amber-700',
  red: 'border-red-200 bg-red-50 text-red-600',
}

function StatusPill({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className={`mj-card p-4 flex items-center justify-between ${TONES[tone]} border`}>
      <span className='text-sm font-medium'>{label}</span>
      <span className='text-xl font-bold mj-mono'>{value}</span>
    </div>
  )
}

function Panel({
  title,
  href,
  children,
  className = '',
}: {
  title: string
  href?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <section className={`mj-card p-5 ${className}`}>
      <div className='flex items-center justify-between mb-3'>
        <h2 className='text-sm font-semibold text-stone-900'>{title}</h2>
        {href && (
          <Link href={href} className='text-xs text-brand-600 hover:text-brand-700'>
            全部 →
          </Link>
        )}
      </div>
      {children}
    </section>
  )
}

function Empty({ children }: { children: React.ReactNode }) {
  return <div className='text-sm text-stone-400 py-6 text-center'>{children}</div>
}
