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
  Anthropic: 'bg-orange-900/40 text-orange-300',
  OpenAI: 'bg-emerald-900/40 text-emerald-300',
  Google: 'bg-blue-900/40 text-blue-300',
  DeepSeek: 'bg-indigo-900/40 text-indigo-300',
  Moonshot: 'bg-purple-900/40 text-purple-300',
  Alibaba: 'bg-cyan-900/40 text-cyan-300',
  MiniMax: 'bg-pink-900/40 text-pink-300',
  Zhipu: 'bg-yellow-900/40 text-yellow-300',
  Other: 'bg-gray-800 text-gray-400',
}

export default async function ModelsPage() {
  const rows = await prisma.siteModelPrice.findMany({
    select: {
      modelName: true,
      siteId: true,
      price: true,
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
    sumPrice: number
    countPrice: number
    sumPass: number
    countPass: number
    sumLat: number
    countLat: number
  }
  const map = new Map<string, Agg>()

  for (const r of rows) {
    const base = r.modelName.split('@')[0]
    const eff = r.price * (r.multiplier || 1)
    let a = map.get(base)
    if (!a) {
      a = { base, sites: new Set(), channels: 0, minPrice: Infinity, sumPrice: 0, countPrice: 0, sumPass: 0, countPass: 0, sumLat: 0, countLat: 0 }
      map.set(base, a)
    }
    a.sites.add(r.siteId)
    a.channels++
    if (eff > 0 && eff < a.minPrice) a.minPrice = eff
    if (eff > 0) { a.sumPrice += eff; a.countPrice++ }
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
      avgPrice: a.countPrice ? a.sumPrice / a.countPrice : null,
      avgPass: a.countPass ? a.sumPass / a.countPass : null,
      avgLat: a.countLat ? a.sumLat / a.countLat : null,
    }))
    .sort((a, b) => b.channelCount - a.channelCount)

  return (
    <main className='min-h-screen p-6 max-w-7xl mx-auto'>
      <div className='mb-8 flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold'>所有模型</h1>
          <p className='text-gray-400 mt-1'>共 {models.length} 个基础模型，覆盖 8 家厂商</p>
        </div>
        <Link href='/' className='text-sm text-gray-400 hover:text-gray-200 transition-colors'>← 返回首页</Link>
      </div>

      <div className='overflow-x-auto rounded-lg border border-gray-800'>
        <table className='w-full text-sm'>
          <thead>
            <tr className='border-b border-gray-800 text-left text-gray-400 bg-gray-900/50'>
              <th className='py-3 px-4 font-medium'>模型</th>
              <th className='py-3 px-4 font-medium'>厂商</th>
              <th className='py-3 px-4 font-medium text-right'>站点</th>
              <th className='py-3 px-4 font-medium text-right'>渠道</th>
              <th className='py-3 px-4 font-medium text-right'>最低价</th>
              <th className='py-3 px-4 font-medium text-right'>平均价</th>
              <th className='py-3 px-4 font-medium text-right'>通过率</th>
              <th className='py-3 px-4 font-medium text-right'>延迟</th>
            </tr>
          </thead>
          <tbody>
            {models.map((m) => (
              <tr key={m.base} className='border-b border-gray-800/50 hover:bg-gray-900/50 transition-colors'>
                <td className='py-3 px-4'>
                  <Link href={`/models/${encodeURIComponent(m.base)}`} className='font-medium text-gray-100 hover:text-blue-400'>
                    {m.base}
                  </Link>
                </td>
                <td className='py-3 px-4'>
                  <span className={`inline-block px-2 py-0.5 rounded text-xs ${providerStyle[m.provider]}`}>{m.provider}</span>
                </td>
                <td className='py-3 px-4 text-right tabular-nums text-gray-300'>{m.siteCount}</td>
                <td className='py-3 px-4 text-right tabular-nums text-gray-300'>{m.channelCount}</td>
                <td className='py-3 px-4 text-right tabular-nums text-gray-100'>
                  {m.minPrice == null ? '-' : `¥${m.minPrice.toFixed(m.minPrice < 1 ? 4 : 2)}`}
                </td>
                <td className='py-3 px-4 text-right tabular-nums text-gray-400'>
                  {m.avgPrice == null ? '-' : `¥${m.avgPrice.toFixed(m.avgPrice < 1 ? 4 : 2)}`}
                </td>
                <td className='py-3 px-4 text-right tabular-nums text-gray-400'>
                  {m.avgPass == null ? '-' : `${m.avgPass.toFixed(1)}%`}
                </td>
                <td className='py-3 px-4 text-right tabular-nums text-gray-400'>
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
