import Link from 'next/link'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

type Scenario = {
  key: string
  title: string
  desc: string
  provider: string
  preferredBases: string[]
}

const SCENARIOS: Scenario[] = [
  {
    key: 'claude-code',
    title: 'Claude 写代码',
    desc: '复杂推理、长上下文、工具调用，Claude Opus 是首选。',
    provider: 'Anthropic',
    preferredBases: ['claude-opus-4-8', 'claude-opus-4-7', 'claude-opus-4-6', 'claude-sonnet-4-6'],
  },
  {
    key: 'gpt-chat',
    title: 'GPT 日常对话',
    desc: '通用对话、写作、翻译，性价比之选。',
    provider: 'OpenAI',
    preferredBases: ['gpt-5.5', 'gpt-5.4'],
  },
  {
    key: 'gemini-mm',
    title: 'Gemini 多模态',
    desc: '图片、视频、长文档理解，Google 的看家本领。',
    provider: 'Google',
    preferredBases: ['gemini-3.1-pro-preview', 'gemini-3.5-flash'],
  },
]

function providerOf(base: string): string {
  if (base.startsWith('claude-')) return 'Anthropic'
  if (base.startsWith('gpt-') || base.startsWith('codex')) return 'OpenAI'
  if (base.startsWith('gemini-')) return 'Google'
  return 'Other'
}

type Pick = {
  channelId: number
  siteId: number
  siteName: string
  siteUrl: string
  base: string
  channel: string
  price: number
  passRate: number | null
  weightedScore: number | null
}

export default async function ModelSelectPage({ searchParams }: { searchParams: Promise<{ s?: string }> }) {
  const sp = await searchParams
  const active = SCENARIOS.find((x) => x.key === sp.s) ?? null

  let picks: Pick[] = []
  if (active) {
    const all = await prisma.siteModelPrice.findMany({
      where: {
        OR: active.preferredBases.flatMap((b) => [{ modelName: { startsWith: `${b}@` } }, { modelName: b }]),
      },
      include: { site: true },
    })
    picks = all
      .filter((r) => providerOf(r.modelName.split('@')[0]) === active.provider)
      .map((r) => ({
        channelId: r.id,
        siteId: r.siteId,
        siteName: r.site.name,
        siteUrl: r.site.url,
        base: r.modelName.split('@')[0],
        channel: r.modelName.includes('@') ? r.modelName.split('@')[1] : 'default',
        price: r.price * (r.multiplier || 1),
        passRate: r.passRate,
        weightedScore: r.weightedScore,
      }))
      .sort((a, b) => (b.weightedScore ?? -1) - (a.weightedScore ?? -1))
      .slice(0, 3)
  }

  return (
    <main className='min-h-screen p-6 max-w-6xl mx-auto'>
      <div className='mb-8 flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold'>模型择优</h1>
          <p className='text-gray-400 mt-1 text-sm'>告诉我们你的场景，我们按综合评分推荐 top 3。</p>
        </div>
        <Link href='/' className='text-sm text-gray-400 hover:text-gray-200'>← 返回首页</Link>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-3 gap-3 mb-8'>
        {SCENARIOS.map((s) => (
          <Link
            key={s.key}
            href={`/model-select?s=${s.key}`}
            className={`block rounded-lg border p-4 transition-colors ${active?.key === s.key ? 'border-blue-500 bg-blue-950/30' : 'border-gray-800 bg-gray-900/40 hover:border-gray-700'}`}
          >
            <div className='font-semibold text-gray-100'>{s.title}</div>
            <div className='text-xs text-gray-400 mt-1'>{s.desc}</div>
          </Link>
        ))}
      </div>

      {active ? (
        <div>
          <h2 className='text-xl font-semibold mb-4'>推荐 — {active.title}</h2>
          {picks.length === 0 ? (
            <div className='text-gray-500 text-sm rounded-lg border border-gray-800 p-8 text-center'>暂无符合条件的渠道</div>
          ) : (
            <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
              {picks.map((p, i) => (
                <div key={p.channelId} className='rounded-lg border border-gray-800 bg-gray-900/50 p-5 flex flex-col'>
                  <div className='flex items-center justify-between mb-3'>
                    <span className={`px-2 py-0.5 rounded text-xs ${i === 0 ? 'bg-yellow-900/40 text-yellow-300' : 'bg-gray-800 text-gray-400'}`}>#{i + 1}</span>
                    <span className='text-xs text-gray-500'>{p.base}</span>
                  </div>
                  <Link href={`/sites/${p.siteId}`} className='text-lg font-semibold text-gray-100 hover:text-blue-400'>{p.siteName}</Link>
                  <div className='text-xs text-gray-500 mt-0.5'>渠道 {p.channel}</div>

                  <div className='mt-4 space-y-2 text-sm flex-1'>
                    <div className='flex justify-between'><span className='text-gray-500'>价格</span><span className='text-gray-100 tabular-nums'>{p.price > 0 ? `¥${p.price.toFixed(p.price < 1 ? 4 : 2)} / 1M` : '-'}</span></div>
                    <div className='flex justify-between'><span className='text-gray-500'>通过率</span><span className='text-gray-100 tabular-nums'>{p.passRate == null ? '-' : `${p.passRate.toFixed(1)}%`}</span></div>
                    <div className='flex justify-between'><span className='text-gray-500'>综合分</span><span className='text-gray-100 tabular-nums'>{p.weightedScore == null ? '-' : p.weightedScore.toFixed(1)}</span></div>
                  </div>

                  <a href={p.siteUrl} target='_blank' rel='noreferrer noopener' className='mt-4 block text-center px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white text-sm transition-colors'>立即使用</a>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className='text-gray-500 text-sm rounded-lg border border-gray-800 border-dashed p-12 text-center'>请选一个场景</div>
      )}
    </main>
  )
}
