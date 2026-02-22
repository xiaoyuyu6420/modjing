import { prisma } from '@/lib/prisma'

async function getDetectionStats() {
  const tamperedCount = await prisma.siteModelPrice.count({ where: { tampered: true } })
  const anomalyCount = await prisma.siteModelPrice.count({ where: { priceAnomaly: true } })
  const totalProbed = await prisma.siteModelPrice.count({ where: { lastProbedAt: { not: null } } })

  const recentTampered = await prisma.siteModelPrice.findMany({
    where: { tampered: true },
    take: 10,
    orderBy: { lastProbedAt: 'desc' },
    include: { site: { select: { name: true } } },
  })

  const recentAnomalies = await prisma.siteModelPrice.findMany({
    where: { priceAnomaly: true },
    take: 10,
    orderBy: { lastProbedAt: 'desc' },
    include: { site: { select: { name: true } } },
  })

  return { tamperedCount, anomalyCount, totalProbed, recentTampered, recentAnomalies }
}

export default async function AdminDetection() {
  const stats = await getDetectionStats()

  return (
    <div className='p-8 space-y-8'>
      <div>
        <h1 className='text-2xl font-bold text-gray-100'>检测记录</h1>
        <p className='text-sm text-gray-500 mt-1'>掺水检测和价格异常监控</p>
      </div>

      {/* Stats */}
      <div className='grid grid-cols-3 gap-4'>
        <div className='bg-gradient-to-br from-red-600/20 to-red-600/5 border border-red-500/20 rounded-xl p-5'>
          <div className='text-3xl font-bold text-red-400'>{stats.tamperedCount}</div>
          <div className='text-xs text-gray-400 mt-1'>检测到掺水</div>
        </div>
        <div className='bg-gradient-to-br from-yellow-600/20 to-yellow-600/5 border border-yellow-500/20 rounded-xl p-5'>
          <div className='text-3xl font-bold text-yellow-400'>{stats.anomalyCount}</div>
          <div className='text-xs text-gray-400 mt-1'>价格异常</div>
        </div>
        <div className='bg-gradient-to-br from-blue-600/20 to-blue-600/5 border border-blue-500/20 rounded-xl p-5'>
          <div className='text-3xl font-bold text-blue-400'>{stats.totalProbed}</div>
          <div className='text-xs text-gray-400 mt-1'>已探测模型</div>
        </div>
      </div>

      {/* Tampered */}
      <div className='bg-gray-900/50 border border-gray-800/50 rounded-xl p-6 space-y-4'>
        <h2 className='text-lg font-semibold text-gray-100'>掺水记录</h2>
        <div className='space-y-2'>
          {stats.recentTampered.map((p) => (
            <div key={p.id} className='flex items-center justify-between px-3 py-2 rounded-lg bg-red-500/5 border border-red-500/10'>
              <div>
                <span className='text-sm text-gray-200'>{p.site.name}</span>
                <span className='text-xs text-gray-500 ml-2 font-mono'>{p.modelName}</span>
              </div>
              <div className='flex items-center gap-3 text-xs'>
                {p.fakeRateBand && (
                  <span className='text-red-400 font-medium'>{p.fakeRateBand}</span>
                )}
                {p.detectedModel && (
                  <span className='text-gray-400'>检测到: {p.detectedModel}</span>
                )}
                {p.lastProbedAt && (
                  <span className='text-gray-500'>{new Date(p.lastProbedAt).toLocaleDateString('zh-CN')}</span>
                )}
              </div>
            </div>
          ))}
          {stats.recentTampered.length === 0 && (
            <p className='text-sm text-gray-500'>暂无掺水记录</p>
          )}
        </div>
      </div>

      {/* Anomalies */}
      <div className='bg-gray-900/50 border border-gray-800/50 rounded-xl p-6 space-y-4'>
        <h2 className='text-lg font-semibold text-gray-100'>价格异常</h2>
        <div className='space-y-2'>
          {stats.recentAnomalies.map((p) => (
            <div key={p.id} className='flex items-center justify-between px-3 py-2 rounded-lg bg-yellow-500/5 border border-yellow-500/10'>
              <div>
                <span className='text-sm text-gray-200'>{p.site.name}</span>
                <span className='text-xs text-gray-500 ml-2 font-mono'>{p.modelName}</span>
              </div>
              <div className='text-xs font-mono text-yellow-400'>¥{p.price.toFixed(4)}</div>
            </div>
          ))}
          {stats.recentAnomalies.length === 0 && (
            <p className='text-sm text-gray-500'>暂无价格异常</p>
          )}
        </div>
      </div>
    </div>
  )
}
