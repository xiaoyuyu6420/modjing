import { prisma } from '@/lib/prisma'

async function getHealthData() {
  const sites = await prisma.site.findMany({
    where: { status: { not: 'offline' } },
    select: {
      id: true,
      name: true,
      url: true,
      status: true,
      healthChecks: {
        take: 10,
        orderBy: { checkedAt: 'desc' },
        select: { latency: true, status: true, checkedAt: true },
      },
    },
    orderBy: { name: 'asc' },
  })

  return sites.map((site) => {
    const checks = site.healthChecks
    const avgLatency = checks.length > 0
      ? Math.round(checks.reduce((s, c) => s + c.latency, 0) / checks.length)
      : null
    const latestStatus = checks[0]?.status || 'unknown'
    const okRate = checks.length > 0
      ? ((checks.filter((c) => c.status === 'ok').length / checks.length) * 100)
      : null

    return { ...site, avgLatency, latestStatus, okRate, checkCount: checks.length }
  })
}

const STATUS_STYLES: Record<string, { dot: string; text: string }> = {
  ok: { dot: 'bg-emerald-400', text: 'text-emerald-400' },
  slow: { dot: 'bg-yellow-400', text: 'text-yellow-400' },
  timeout: { dot: 'bg-red-400', text: 'text-red-400' },
  error: { dot: 'bg-red-500', text: 'text-red-500' },
  unknown: { dot: 'bg-gray-500', text: 'text-gray-500' },
}

export default async function AdminHealth() {
  const sites = await getHealthData()

  return (
    <div className='p-8 space-y-6'>
      <div>
        <h1 className='text-2xl font-bold text-gray-100'>健康监控</h1>
        <p className='text-sm text-gray-500 mt-1'>共 {sites.length} 个活跃站点</p>
      </div>

      <div className='grid gap-4'>
        {sites.map((site) => {
          const style = STATUS_STYLES[site.latestStatus] || STATUS_STYLES.unknown
          return (
            <div key={site.id} className='bg-gray-900/50 border border-gray-800/50 rounded-xl p-5'>
              <div className='flex items-center justify-between mb-3'>
                <div className='flex items-center gap-3'>
                  <div className={`w-2.5 h-2.5 rounded-full ${style.dot}`} />
                  <div>
                    <span className='font-medium text-gray-200'>{site.name}</span>
                    <span className='text-xs text-gray-500 ml-2'>{site.url}</span>
                  </div>
                </div>
                <div className='flex items-center gap-4 text-xs'>
                  {site.avgLatency != null && (
                    <span className='text-gray-400'>
                      平均延迟: <span className='font-mono text-gray-200'>{site.avgLatency}ms</span>
                    </span>
                  )}
                  {site.okRate != null && (
                    <span className='text-gray-400'>
                      健康率: <span className={`font-mono ${site.okRate >= 99 ? 'text-emerald-400' : site.okRate >= 95 ? 'text-yellow-400' : 'text-red-400'}`}>
                        {site.okRate.toFixed(1)}%
                      </span>
                    </span>
                  )}
                  <span className='text-gray-500'>{site.checkCount} 条记录</span>
                </div>
              </div>

              {/* Latency sparkline */}
              {site.healthChecks.length > 0 && (
                <div className='flex items-end gap-1 h-8'>
                  {site.healthChecks.reverse().map((check, i) => {
                    const maxLatency = 2000
                    const height = Math.min((check.latency / maxLatency) * 100, 100)
                    const barColor = check.status === 'ok'
                      ? 'bg-emerald-500/60'
                      : check.status === 'slow'
                        ? 'bg-yellow-500/60'
                        : 'bg-red-500/60'
                    return (
                      <div
                        key={i}
                        className={`flex-1 rounded-t ${barColor}`}
                        style={{ height: `${Math.max(height, 4)}%` }}
                        title={`${check.latency}ms - ${check.status} - ${new Date(check.checkedAt).toLocaleString('zh-CN')}`}
                      />
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
        {sites.length === 0 && (
          <div className='text-center py-12 text-gray-500'>暂无健康检查数据</div>
        )}
      </div>
    </div>
  )
}
