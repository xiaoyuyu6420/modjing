import { prisma } from '@/lib/prisma'

async function getDashboardStats() {
  const [siteCount, priceCount, reviewCount, noticeCount] = await Promise.all([
    prisma.site.count(),
    prisma.siteModelPrice.count(),
    prisma.review.count(),
    prisma.relayNotice.count(),
  ])

  const [onlineCount, unstableCount, offlineCount] = await Promise.all([
    prisma.site.count({ where: { status: 'online' } }),
    prisma.site.count({ where: { status: 'unstable' } }),
    prisma.site.count({ where: { status: 'offline' } }),
  ])

  const [freeCount, paidCount] = await Promise.all([
    prisma.site.count({ where: { isFree: true } }),
    prisma.site.count({ where: { isFree: false } }),
  ])

  const recentSites = await prisma.site.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    select: { id: true, name: true, url: true, status: true, createdAt: true },
  })

  const recentReviews = await prisma.review.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    include: { site: { select: { name: true } } },
  })

  return {
    siteCount, priceCount, reviewCount, noticeCount,
    onlineCount, unstableCount, offlineCount,
    freeCount, paidCount,
    recentSites, recentReviews,
  }
}

const STATUS_COLORS: Record<string, string> = {
  online: 'text-emerald-400',
  unstable: 'text-yellow-400',
  offline: 'text-red-400',
}

export default async function AdminDashboard() {
  const stats = await getDashboardStats()

  return (
    <div className='p-8 space-y-8'>
      <div>
        <h1 className='text-2xl font-bold text-gray-100'>仪表盘</h1>
        <p className='text-sm text-gray-500 mt-1'>模镜管理后台 — 数据概览</p>
      </div>

      {/* Stats Cards */}
      <div className='grid grid-cols-2 lg:grid-cols-4 gap-4'>
        <StatCard label='收录站点' value={stats.siteCount} color='blue' />
        <StatCard label='价格条目' value={stats.priceCount} color='purple' />
        <StatCard label='用户评价' value={stats.reviewCount} color='amber' />
        <StatCard label='站点公告' value={stats.noticeCount} color='emerald' />
      </div>

      {/* Site Status */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        <div className='bg-gray-900/50 border border-gray-800/50 rounded-xl p-6 space-y-4'>
          <h2 className='text-lg font-semibold text-gray-100'>站点状态分布</h2>
          <div className='space-y-3'>
            <StatusBar label='在线' count={stats.onlineCount} total={stats.siteCount} color='bg-emerald-500' />
            <StatusBar label='不稳定' count={stats.unstableCount} total={stats.siteCount} color='bg-yellow-500' />
            <StatusBar label='已下线' count={stats.offlineCount} total={stats.siteCount} color='bg-red-500' />
          </div>
          <div className='pt-2 flex gap-4 text-xs text-gray-500'>
            <span>免费站: <span className='text-gray-300 font-medium'>{stats.freeCount}</span></span>
            <span>付费站: <span className='text-gray-300 font-medium'>{stats.paidCount}</span></span>
          </div>
        </div>

        {/* Recent Sites */}
        <div className='bg-gray-900/50 border border-gray-800/50 rounded-xl p-6 space-y-4'>
          <h2 className='text-lg font-semibold text-gray-100'>最近添加</h2>
          <div className='space-y-2'>
            {stats.recentSites.map((site) => (
              <a
                key={site.id}
                href={`/admin/sites?id=${site.id}`}
                className='flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-800/50 transition-colors group'
              >
                <div>
                  <span className='text-sm text-gray-200 group-hover:text-gray-100'>{site.name}</span>
                  <span className='text-xs text-gray-500 ml-2'>{site.url}</span>
                </div>
                <span className={`text-xs font-medium ${STATUS_COLORS[site.status]}`}>
                  {site.status}
                </span>
              </a>
            ))}
            {stats.recentSites.length === 0 && (
              <p className='text-sm text-gray-500'>暂无数据</p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Reviews */}
      <div className='bg-gray-900/50 border border-gray-800/50 rounded-xl p-6 space-y-4'>
        <h2 className='text-lg font-semibold text-gray-100'>最新评价</h2>
        <div className='grid gap-3'>
          {stats.recentReviews.map((review) => (
            <div key={review.id} className='flex items-start gap-3 px-3 py-3 rounded-lg bg-gray-800/30'>
              <div className='shrink-0 w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-xs font-bold text-gray-300'>
                {review.author.charAt(0)}
              </div>
              <div className='flex-1 min-w-0'>
                <div className='flex items-center gap-2'>
                  <span className='text-sm font-medium text-gray-200'>{review.author}</span>
                  <span className='text-xs text-gray-500'>评价 {review.site.name}</span>
                  <span className='text-xs text-yellow-400'>{'★'.repeat(review.rating)}</span>
                </div>
                <p className='text-sm text-gray-400 mt-1 truncate'>{review.content}</p>
              </div>
            </div>
          ))}
          {stats.recentReviews.length === 0 && (
            <p className='text-sm text-gray-500'>暂无评价</p>
          )}
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  const colorMap: Record<string, string> = {
    blue: 'from-blue-600/20 to-blue-600/5 border-blue-500/20 text-blue-400',
    purple: 'from-purple-600/20 to-purple-600/5 border-purple-500/20 text-purple-400',
    amber: 'from-amber-600/20 to-amber-600/5 border-amber-500/20 text-amber-400',
    emerald: 'from-emerald-600/20 to-emerald-600/5 border-emerald-500/20 text-emerald-400',
  }

  return (
    <div className={`bg-gradient-to-br ${colorMap[color]} border rounded-xl p-5`}>
      <div className={`text-3xl font-bold ${colorMap[color].split(' ').pop()}`}>{value.toLocaleString()}</div>
      <div className='text-xs text-gray-400 mt-1'>{label}</div>
    </div>
  )
}

function StatusBar({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const pct = total > 0 ? (count / total) * 100 : 0

  return (
    <div className='space-y-1'>
      <div className='flex items-center justify-between text-sm'>
        <span className='text-gray-300'>{label}</span>
        <span className='text-gray-400 font-mono'>{count} <span className='text-gray-600'>({pct.toFixed(1)}%)</span></span>
      </div>
      <div className='h-2 bg-gray-800 rounded-full overflow-hidden'>
        <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}
