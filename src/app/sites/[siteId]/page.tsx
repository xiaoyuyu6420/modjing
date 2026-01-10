import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { ModelPriceTable } from './_components/ModelPriceTable'
import { PriceHistoryList } from './_components/PriceHistoryList'

export const dynamic = 'force-dynamic'

const COMPLIANCE_LABELS: Record<string, string> = {
  none: '无',
  basic: '基础',
  iso27001: 'ISO 27001',
  mlps2: '等保二级',
  mlps3: '等保三级',
}

const DATA_LOC_LABELS: Record<string, string> = {
  CN: '中国大陆',
  US: '美国',
  EU: '欧盟',
  Mixed: '混合部署',
}

export default async function SiteDetailPage({
  params,
}: {
  params: Promise<{ siteId: string }>
}) {
  const { siteId } = await params
  const id = Number(siteId)
  if (!Number.isFinite(id)) notFound()

  const site = await prisma.site.findUnique({
    where: { id },
    include: {
      modelPrices: {
        include: {
          priceHistory: { take: 5, orderBy: { recordedAt: 'desc' } },
        },
      },
      reviews: { orderBy: { createdAt: 'desc' } },
      notices: { take: 5, orderBy: { publishedAt: 'desc' } },
    },
  })

  if (!site) notFound()

  const scores = site.modelPrices
    .map((p) => p.weightedScore)
    .filter((v): v is number => typeof v === 'number')
  const avgScore = scores.length
    ? scores.reduce((a, b) => a + b, 0) / scores.length
    : null

  const groupMap = new Map<string, typeof site.modelPrices>()
  for (const p of site.modelPrices) {
    const [base] = p.modelName.split('@')
    const arr = groupMap.get(base) ?? []
    arr.push(p)
    groupMap.set(base, arr)
  }
  const groups = Array.from(groupMap.entries())
    .map(([baseModel, items]) => ({
      baseModel,
      channels: items.map((c) => ({
        id: c.id,
        channelName: c.modelName.split('@')[1] ?? 'default',
        price: c.price,
        priceUnit: c.priceUnit,
        multiplier: c.multiplier,
        passRate: c.passRate,
        onlineRate: c.onlineRate,
        fakeRateBand: c.fakeRateBand,
        avgLatencyMs: c.avgLatencyMs,
        lastProbedAt: c.lastProbedAt?.toISOString() ?? null,
        priceAnomaly: c.priceAnomaly,
        tampered: c.tampered,
        weightedScore: c.weightedScore,
        afterSales: c.afterSales,
      })),
    }))
    .sort((a, b) => b.channels.length - a.channels.length)

  const history = site.modelPrices
    .flatMap((p) => {
      const [base, ch] = p.modelName.split('@')
      return p.priceHistory.map((h) => ({
        channelKey: p.modelName,
        baseModel: base,
        channelName: ch ?? 'default',
        price: h.price,
        recordedAt: h.recordedAt.toISOString(),
      }))
    })
    .sort((a, b) => +new Date(b.recordedAt) - +new Date(a.recordedAt))
    .slice(0, 30)

  const compliance = site.complianceLevel ?? 'none'

  return (
    <main className='min-h-screen p-6 max-w-7xl mx-auto'>
      <div className='mb-6'>
        <Link
          href='/sites'
          className='text-sm text-gray-400 hover:text-gray-200'
        >
          ← 返回站点列表
        </Link>
      </div>

      <header className='mb-6 flex items-start gap-4 flex-wrap'>
        {site.logo ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={site.logo}
            alt={site.name}
            className='w-16 h-16 rounded-lg border border-gray-800 bg-gray-900 object-contain'
          />
        ) : (
          <div className='w-16 h-16 rounded-lg border border-gray-800 bg-gray-900 flex items-center justify-center text-2xl text-gray-500'>
            {site.name.slice(0, 1)}
          </div>
        )}
        <div className='flex-1 min-w-0'>
          <div className='flex items-center gap-3 flex-wrap'>
            <h1 className='text-3xl font-bold text-gray-100'>{site.name}</h1>
            <StatusBadge status={site.status} />
            {site.isFree && (
              <span className='inline-block px-2 py-0.5 rounded text-xs border border-blue-800/50 text-blue-300 bg-blue-900/30'>
                公益站
              </span>
            )}
          </div>
          <a
            href={site.url}
            target='_blank'
            rel='noreferrer'
            className='text-sm text-gray-400 hover:text-blue-400 inline-flex items-center gap-1 mt-1'
          >
            {site.url} ↗
          </a>
        </div>
        <div className='text-right'>
          <div className='text-xs text-gray-500'>综合评分</div>
          <div className='text-4xl font-bold text-blue-400 font-mono'>
            {avgScore == null ? '-' : avgScore.toFixed(1)}
          </div>
        </div>
      </header>

      {site.announcement && (
        <div className='mb-6 border border-yellow-900/50 bg-yellow-950/30 text-yellow-200 rounded-lg px-4 py-3 text-sm'>
          <span className='font-medium mr-2'>公告</span>
          {site.announcement}
        </div>
      )}

      <div className='grid md:grid-cols-3 gap-6 mb-8'>
        <section className='md:col-span-2 border border-gray-800 rounded-lg p-5 bg-gray-900/30'>
          <h2 className='text-lg font-semibold mb-2'>站点介绍</h2>
          <p className='text-gray-300 text-sm whitespace-pre-line leading-relaxed'>
            {site.description?.trim() || '该站点尚未提供介绍。'}
          </p>
          <div className='mt-4 text-xs text-gray-500'>
            收录时间：{new Date(site.createdAt).toLocaleDateString('zh-CN')}
            {site.paymentMethods && (
              <span className='ml-4'>支付方式：{site.paymentMethods}</span>
            )}
          </div>
        </section>

        <aside className='border border-gray-800 rounded-lg p-5 bg-gray-900/30'>
          <h2 className='text-lg font-semibold mb-3'>企业合规</h2>
          <dl className='text-sm space-y-2'>
            <Row label='发票' value={site.hasInvoice ? site.invoiceTypes || '支持' : '不支持'} />
            <Row label='合规等级' value={COMPLIANCE_LABELS[compliance] ?? compliance} />
            <Row
              label='数据所在地'
              value={site.dataLocation ? DATA_LOC_LABELS[site.dataLocation] ?? site.dataLocation : '-'}
            />
            <Row
              label='承诺 SLA'
              value={site.slaUptime ? `${site.slaUptime.toFixed(2)}%` : '-'}
            />
            <Row
              label='企业账户'
              value={site.hasEnterpriseAccount ? '支持' : '-'}
            />
            <Row label='子账号' value={site.hasSubAccounts ? '支持' : '-'} />
            <Row label='7x24 支持' value={site.has24x7Support ? '是' : '-'} />
          </dl>
        </aside>
      </div>

      <section className='mb-8'>
        <h2 className='text-xl font-semibold mb-3'>模型 / 渠道价格</h2>
        <ModelPriceTable groups={groups} />
      </section>

      <section className='mb-8'>
        <h2 className='text-xl font-semibold mb-3'>价格历史</h2>
        <PriceHistoryList items={history} />
      </section>

      <section className='mb-8'>
        <h2 className='text-xl font-semibold mb-3'>
          用户评价{' '}
          <span className='text-sm text-gray-500 font-normal'>
            （{site.reviews.length}）
          </span>
        </h2>
        {site.reviews.length === 0 ? (
          <div className='border border-gray-800 rounded-lg p-6 text-center text-gray-500 text-sm'>
            还没有用户评价。
          </div>
        ) : (
          <div className='space-y-3'>
            {site.reviews.map((r) => (
              <div
                key={r.id}
                className='border border-gray-800 rounded-lg p-4 bg-gray-900/30'
              >
                <div className='flex items-center justify-between mb-2'>
                  <span className='text-gray-200 font-medium'>{r.author}</span>
                  <span className='text-yellow-400 text-sm'>
                    {'★'.repeat(r.rating)}
                    <span className='text-gray-700'>
                      {'★'.repeat(5 - r.rating)}
                    </span>
                  </span>
                </div>
                <p className='text-sm text-gray-300'>{r.content}</p>
                <div className='text-xs text-gray-500 mt-2'>
                  {new Date(r.createdAt).toLocaleString('zh-CN')}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <footer className='border-t border-gray-800 pt-4 text-xs text-gray-500'>
        部分数据来自{' '}
        <a
          href='https://hvoy.ai'
          target='_blank'
          rel='noreferrer'
          className='text-gray-400 hover:text-blue-400'
        >
          hvoy.ai
        </a>{' '}
        公开探针。
      </footer>
    </main>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className='flex justify-between gap-3'>
      <dt className='text-gray-500'>{label}</dt>
      <dd className='text-gray-200 text-right'>{value}</dd>
    </div>
  )
}
