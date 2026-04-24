import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { SitesTable, type SiteRow } from '../sites/_components/SitesTable'

export const dynamic = 'force-dynamic'

export default async function FreeSitesPage() {
  const sites = await prisma.site.findMany({
    where: { isFree: true },
    include: {
      modelPrices: {
        select: { weightedScore: true, priceAnomaly: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  const rows: SiteRow[] = sites.map((s) => {
    const scores = s.modelPrices
      .map((p) => p.weightedScore)
      .filter((v): v is number => typeof v === 'number')
    const avg = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : null
    return {
      id: s.id,
      name: s.name,
      url: s.url,
      status: s.status,
      isFree: s.isFree,
      hasInvoice: s.hasInvoice,
      complianceLevel: s.complianceLevel,
      modelCount: s.modelPrices.length,
      anomalyCount: s.modelPrices.filter((p) => p.priceAnomaly).length,
      avgScore: avg,
      createdAt: s.createdAt.toISOString(),
    }
  })

  const online = rows.filter((r) => r.status === 'online').length

  return (
    <main className='min-h-screen p-6 max-w-7xl mx-auto'>
      <div className='mb-6 flex items-start justify-between gap-4 flex-wrap'>
        <div>
          <h1 className='text-3xl font-bold'>公益 API 中转站</h1>
          <p className='text-stone-500 mt-1 text-sm max-w-2xl leading-relaxed'>
            由独立开发者或社区维护的免费 API 中转站。
            <span className='text-yellow-600'>免费不等于稳定</span>
            ，请合理使用、不要刷量，
            为站长留点服务器钱，让公益走得更远。
          </p>
        </div>
        <Link href='/' className='text-sm text-stone-500 hover:text-stone-800'>
          ← 返回首页
        </Link>
      </div>

      <div className='grid grid-cols-2 md:grid-cols-3 gap-3 mb-6'>
        <StatCard label='公益站数' value={rows.length} accent='text-brand-600' />
        <StatCard label='当前在线' value={online} accent='text-green-600' />
        <StatCard
          label='收录占比'
          value={`${rows.length ? ((rows.length / 447) * 100).toFixed(1) : '0'}%`}
        />
      </div>

      <SitesTable rows={rows} />

      <div className='mt-8 border border-stone-200 rounded-lg p-5 bg-white text-sm text-stone-500 leading-relaxed'>
        <h3 className='text-stone-800 font-medium mb-2'>给公益站长的话</h3>
        <p>
          如果你运营的公益站希望被收录、修改信息或下线，欢迎联系模镜。
          模镜不向公益站收取任何费用，仅做客观记录。
        </p>
      </div>
    </main>
  )
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string
  value: number | string
  accent?: string
}) {
  return (
    <div className='border border-stone-200 rounded-lg p-4 bg-white'>
      <div className='text-xs text-stone-500'>{label}</div>
      <div className={`text-2xl font-bold mt-1 ${accent ?? 'text-stone-900'}`}>
        {value}
      </div>
    </div>
  )
}
