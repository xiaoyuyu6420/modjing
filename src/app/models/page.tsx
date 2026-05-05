import Link from 'next/link'
import { prisma } from '@/lib/prisma'

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

const providerStyle: Record<string, string> = {
  Anthropic: 'border-orange-200 bg-orange-50 text-orange-700',
  OpenAI: 'border-brand-200 bg-brand-50 text-brand-700',
  Google: 'border-sky-200 bg-sky-50 text-sky-700',
  DeepSeek: 'border-indigo-200 bg-indigo-50 text-indigo-700',
  Moonshot: 'border-violet-200 bg-violet-50 text-violet-700',
  Alibaba: 'border-cyan-200 bg-cyan-50 text-cyan-700',
  MiniMax: 'border-pink-200 bg-pink-50 text-pink-700',
  Zhipu: 'border-amber-200 bg-amber-50 text-amber-700',
  Other: 'border-stone-200 bg-stone-50 text-stone-600',
}

export default async function ModelsPage() {
  const rows = await prisma.siteModelPrice.findMany({
    select: {
      modelName: true,
      siteId: true,
      price: true,
      priceOutput: true,
      multiplier: true,
      passRate: true,
      avgLatencyMs: true,
    },
  })

  type Agg = {
    base: string
    sites: Set<number>
    channels: number
    minPrice: number
    minOutPrice: number
    sumPrice: number
    sumOutPrice: number
    countPrice: number
    countOutPrice: number
    sumPass: number
    countPass: number
    sumLat: number
    countLat: number
  }
  const map = new Map<string, Agg>()

  for (const r of rows) {
    const base = r.modelName.split('@')[0]
    const eff = r.price * (r.multiplier || 1)
    const effOut = (r.priceOutput || 0) * (r.multiplier || 1)
    let a = map.get(base)
    if (!a) {
      a = { base, sites: new Set(), channels: 0, minPrice: Infinity, minOutPrice: Infinity, sumPrice: 0, sumOutPrice: 0, countPrice: 0, countOutPrice: 0, sumPass: 0, countPass: 0, sumLat: 0, countLat: 0 }
      map.set(base, a)
    }
    a.sites.add(r.siteId)
    a.channels++
    if (eff > 0 && eff < a.minPrice) a.minPrice = eff
    if (effOut > 0 && effOut < a.minOutPrice) a.minOutPrice = effOut
    if (eff > 0) { a.sumPrice += eff; a.countPrice++ }
    if (effOut > 0) { a.sumOutPrice += effOut; a.countOutPrice++ }
    if (r.passRate != null) { a.sumPass += r.passRate; a.countPass++ }
    if (r.avgLatencyMs != null) { a.sumLat += r.avgLatencyMs; a.countLat++ }
  }

  const models = Array.from(map.values())
    .map((a) => ({
      base: a.base,
      provider: providerOf(a.base),
      siteCount: a.sites.size,
      channelCount: a.channels,
      minPrice: a.minPrice === Infinity ? null : a.minPrice,
      minOutPrice: a.minOutPrice === Infinity ? null : a.minOutPrice,
      avgPrice: a.countPrice ? a.sumPrice / a.countPrice : null,
      avgOutPrice: a.countOutPrice ? a.sumOutPrice / a.countOutPrice : null,
      avgPass: a.countPass ? a.sumPass / a.countPass : null,
      avgLat: a.countLat ? a.sumLat / a.countLat : null,
    }))
    .sort((a, b) => b.channelCount - a.channelCount)

  const providers = new Set(models.map((m) => m.provider))

  return (
    <main className='min-h-screen p-6 max-w-7xl mx-auto'>
      <div className='mb-8 flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>所有模型</h1>
          <p className='text-stone-500 mt-1.5'>共 {models.length} 个基础模型，覆盖 {providers.size} 家厂商</p>
        </div>
        <Link href='/' className='text-sm text-stone-500 hover:text-brand-700'>← 返回首页</Link>
      </div>

      <div className='mj-table-wrap'>
        <table className='mj-table'>
          <thead>
            <tr>
              <th className='mj-th'>模型</th>
              <th className='mj-th'>厂商</th>
              <th className='mj-th text-right'>站点</th>
              <th className='mj-th text-right'>渠道</th>
              <th className='mj-th text-right'>最低输入价</th>
              <th className='mj-th text-right'>最低输出价</th>
              <th className='mj-th text-right'>平均输入价</th>
              <th className='mj-th text-right'>平均输出价</th>
              <th className='mj-th text-right'>通过率</th>
              <th className='mj-th text-right'>延迟</th>
            </tr>
          </thead>
          <tbody>
            {models.map((m) => (
              <tr key={m.base} className='mj-row'>
                <td className='mj-td'>
                  <Link
                    href={`/models/${encodeURIComponent(m.base)}`}
                    className='font-medium text-stone-900 hover:text-brand-700'
                  >
                    {m.base}
                  </Link>
                </td>
                <td className='mj-td'>
                  <span className={`mj-badge ${providerStyle[m.provider]}`}>{m.provider}</span>
                </td>
                <td className='mj-td text-right mj-mono text-stone-700'>{m.siteCount}</td>
                <td className='mj-td text-right mj-mono text-stone-700'>{m.channelCount}</td>
                <td className='mj-td text-right mj-mono text-stone-900'>
                  {m.minPrice == null ? '-' : `¥${m.minPrice.toFixed(m.minPrice < 1 ? 4 : 2)}`}
                </td>
                <td className='mj-td text-right mj-mono text-stone-900'>
                  {m.minOutPrice == null ? '-' : `¥${m.minOutPrice.toFixed(m.minOutPrice < 1 ? 4 : 2)}`}
                </td>
                <td className='mj-td text-right mj-mono text-stone-400'>
                  {m.avgPrice == null ? '-' : `¥${m.avgPrice.toFixed(m.avgPrice < 1 ? 4 : 2)}`}
                </td>
                <td className='mj-td text-right mj-mono text-stone-400'>
                  {m.avgOutPrice == null ? '-' : `¥${m.avgOutPrice.toFixed(m.avgOutPrice < 1 ? 4 : 2)}`}
                </td>
                <td className='mj-td text-right mj-mono text-stone-400'>
                  {m.avgPass == null ? '-' : `${m.avgPass.toFixed(1)}%`}
                </td>
                <td className='mj-td text-right mj-mono text-stone-400'>
                  {m.avgLat == null ? '-' : `${Math.round(m.avgLat)}ms`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  )
}
