import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import LeaderboardTabs, { type ModelTop } from './_tabs'

export const dynamic = 'force-dynamic'

const TABS = [
  'claude-opus-4-7',
  'claude-opus-4-8',
  'claude-sonnet-4-6',
  'gpt-5.5',
  'gemini-3.1-pro-preview',
  'deepseek-v4-pro',
  'kimi-k2.6',
]

export default async function LeaderboardPage() {
  const all = await prisma.siteModelPrice.findMany({
    where: { OR: TABS.flatMap((t) => [{ modelName: { startsWith: `${t}@` } }, { modelName: t }]) },
    include: { site: true },
  })

  const byModel: Record<string, ModelTop[]> = {}
  for (const t of TABS) byModel[t] = []
  for (const r of all) {
    const base = r.modelName.split('@')[0]
    if (!byModel[base]) continue
    byModel[base].push({
      id: r.id,
      siteId: r.siteId,
      siteName: r.site.name,
      channel: r.modelName.includes('@') ? r.modelName.split('@')[1] : 'default',
      price: r.price * (r.multiplier || 1),
      passRate: r.passRate,
      onlineRate: r.onlineRate,
      weightedScore: r.weightedScore,
      url: r.site.url,
    })
  }
  for (const t of TABS) {
    byModel[t] = byModel[t]
      .sort((a, b) => (b.weightedScore ?? -1) - (a.weightedScore ?? -1))
      .slice(0, 20)
  }

  return (
    <main className='min-h-screen p-6 max-w-7xl mx-auto'>
      <div className='mb-8 flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold'>综合排行榜</h1>
          <p className='text-gray-400 mt-1 text-sm'>按模镜综合评分排序，覆盖热门 7 个基础模型。</p>
        </div>
        <Link href='/' className='text-sm text-gray-400 hover:text-gray-200'>← 返回首页</Link>
      </div>
      <LeaderboardTabs tabs={TABS} data={byModel} />
    </main>
  )
}
