import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { SitesTable, type SiteRow } from './_components/SitesTable'

export const dynamic = 'force-dynamic'

async function loadRows(): Promise<{
  rows: SiteRow[]
  total: number
  online: number
  free: number
  invoice: number
}> {
  const sites = await prisma.site.findMany({
    include: {
      modelPrices: {
        select: { weightedScore: true, priceAnomaly: true, price: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  let online = 0
  let free = 0
  let invoice = 0
  const rows: SiteRow[] = sites.map((s) => {
    if (s.status === 'online') online++
    if (s.isFree) free++
    if (s.hasInvoice) invoice++
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
  return { rows, total: sites.length, online, free, invoice }
}

export default async function SitesPage() {
  const { rows, total, online, free, invoice } = await loadRows()

  return (
    <main className='min-h-screen p-6 max-w-7xl mx-auto'>
      <div className='mb-6 flex items-start justify-between gap-4 flex-wrap'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>中转站列表</h1>
          <p className='text-stone-500 mt-1.5 text-sm'>
            模镜收录的所有 API 中转站，按综合评分排序。点击站点名查看详情。
          </p>
        </div>
        <Link href='/' className='text-sm text-stone-500 hover:text-brand-700 mt-1'>
          ← 返回首页
        </Link>
      </div>

      <div className='grid grid-cols-2 md:grid-cols-4 gap-3 mb-6'>
        <StatCard label='总站点' value={total} />
        <StatCard label='在线' value={online} accent='text-brand-600' />
        <StatCard label='公益站' value={free} accent='text-sky-600' />
        <StatCard label='支持发票' value={invoice} accent='text-violet-600' />
      </div>

      <SitesTable rows={rows} />
    </main>
  )
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string
  value: number
  accent?: string
}) {
  return (
    <div className='mj-card p-4'>
      <div className='text-xs text-stone-500'>{label}</div>
      <div className={`text-2xl font-bold mt-1 mj-mono ${accent ?? 'text-stone-900'}`}>
        {value.toLocaleString()}
      </div>
    </div>
  )
}
