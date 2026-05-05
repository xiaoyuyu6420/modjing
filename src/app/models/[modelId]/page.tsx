import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import ModelCompareTable, { type Channel } from './_components/ModelCompareTable'

export const dynamic = 'force-dynamic'

function providerOf(base: string): string {
  if (base.startsWith('claude-')) return 'Anthropic'
  if (base.startsWith('gpt-') || base.startsWith('codex')) return 'OpenAI'
  if (base.startsWith('gemini-')) return 'Google'
  if (base.startsWith('deepseek-')) return 'DeepSeek'
  if (base.startsWith('kimi-')) return 'Moonshot'
  if (base.startsWith('qwen')) return 'Alibaba'
  if (base.startsWith('MiniMax-') || base.startsWith('mimo-')) return 'MiniMax'
  if (base.startsWith('glm-')) return 'Zhipu'
  return 'Other'
}

export default async function ModelDetailPage({ params }: { params: Promise<{ modelId: string }> }) {
  const { modelId } = await params
  const base = decodeURIComponent(modelId)
  const provider = providerOf(base)

  const rows = await prisma.siteModelPrice.findMany({
    where: { modelName: { startsWith: `${base}@` } },
    include: { site: true },
  })

  const exactRows = await prisma.siteModelPrice.findMany({
    where: { modelName: base },
    include: { site: true },
  })

  const all = [...rows, ...exactRows]

  const channels: Channel[] = all.map((r) => ({
    id: r.id,
    siteId: r.siteId,
    siteName: r.site.name,
    siteUrl: r.site.url,
    siteStatus: r.site.status,
    siteIsFree: r.site.isFree,
    siteHasInvoice: r.site.hasInvoice,
    channel: r.modelName.includes('@') ? r.modelName.split('@')[1] : '',
    price: r.price,
    priceOutput: r.priceOutput,
    priceCached: r.priceCached,
    priceCacheCreate: r.priceCacheCreate,
    multiplier: r.multiplier,
    priceUnit: r.priceUnit,
    passRate: r.passRate,
    onlineRate: r.onlineRate,
    fakeRateBand: r.fakeRateBand,
    avgLatencyMs: r.avgLatencyMs,
    weightedScore: r.weightedScore,
    tampered: r.tampered,
    priceAnomaly: r.priceAnomaly,
  }))

  const siteCount = new Set(channels.map((c) => c.siteId)).size
  const eff = channels.map((c) => c.price * (c.multiplier || 1)).filter((p) => p > 0)
  const minPrice = eff.length ? Math.min(...eff) : null
  const passVals = channels.map((c) => c.passRate).filter((p): p is number => p != null)
  const avgPass = passVals.length ? passVals.reduce((a, b) => a + b, 0) / passVals.length : null

  if (channels.length === 0) {
    return (
      <main className='min-h-screen p-6 max-w-7xl mx-auto'>
        <Link href='/models' className='text-sm text-stone-500 hover:text-brand-700'>← 所有模型</Link>
        <div className='mt-12 text-center'>
          <h1 className='text-2xl font-bold text-stone-900'>{base}</h1>
          <p className='mt-4 text-stone-400'>暂无站点收录此模型</p>
        </div>
      </main>
    )
  }

  return (
    <main className='min-h-screen p-6 max-w-7xl mx-auto'>
      <div className='mb-6'>
        <Link href='/models' className='text-sm text-stone-500 hover:text-brand-700'>← 所有模型</Link>
      </div>

      <div className='mb-6'>
        <div className='flex items-center gap-3 flex-wrap'>
          <h1 className='text-3xl font-bold tracking-tight text-stone-900'>{base}</h1>
          <span className='mj-badge border-stone-200 bg-stone-100 text-stone-600'>{provider}</span>
        </div>
        <p className='text-stone-500 mt-2 text-sm'>
          对比 {channels.length} 个渠道，找最便宜、最稳的中转站。所有数据来自模镜公开探针。
        </p>
      </div>

      <div className='grid grid-cols-2 md:grid-cols-4 gap-3 mb-6'>
        <Stat label='收录站点' value={`${siteCount}`} />
        <Stat label='渠道总数' value={`${channels.length}`} />
        <Stat label='最低价' value={minPrice == null ? '-' : `¥${minPrice.toFixed(minPrice < 1 ? 4 : 2)}`} hint='/ 1M tokens' />
        <Stat label='平均通过率' value={avgPass == null ? '-' : `${avgPass.toFixed(1)}%`} />
      </div>

      <ModelCompareTable channels={channels} />
    </main>
  )
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className='mj-card p-4'>
      <div className='text-xs text-stone-500'>{label}</div>
      <div className='mt-1 text-xl font-semibold text-stone-900 mj-mono'>{value}</div>
      {hint ? <div className='text-[10px] text-stone-400 mt-0.5'>{hint}</div> : null}
    </div>
  )
}
