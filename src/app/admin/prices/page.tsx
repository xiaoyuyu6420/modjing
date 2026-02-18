import { prisma } from '@/lib/prisma'
import PriceActions from './price-actions'

async function getPrices(searchParams: { [key: string]: string | string[] | undefined }) {
  const q = typeof searchParams.q === 'string' ? searchParams.q : undefined
  const model = typeof searchParams.model === 'string' ? searchParams.model : undefined

  const where: Record<string, unknown> = {}
  if (q) {
    where.site = { name: { contains: q } }
  }
  if (model) {
    where.modelName = model
  }

  const prices = await prisma.siteModelPrice.findMany({
    where,
    orderBy: [{ modelName: 'asc' }, { price: 'asc' }],
    include: { site: { select: { id: true, name: true, url: true } } },
  })

  const models = await prisma.siteModelPrice.findMany({
    distinct: ['modelName'],
    select: { modelName: true },
    orderBy: { modelName: 'asc' },
  })

  return { prices, models: models.map((m) => m.modelName) }
}

const BAND_COLORS: Record<string, string> = {
  minimal: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  low: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  light: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  severe: 'bg-red-500/10 text-red-400 border-red-500/20',
}

export default async function AdminPrices({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams
  const { prices, models } = await getPrices(params)

  return (
    <div className='p-8 space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold text-gray-100'>价格管理</h1>
          <p className='text-sm text-gray-500 mt-1'>共 {prices.length} 条价格记录</p>
        </div>
        <a
          href='/admin/prices/new'
          className='px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2'
        >
          <svg className='w-4 h-4' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2}>
            <path strokeLinecap='round' strokeLinejoin='round' d='M12 4.5v15m7.5-7.5h-15' />
          </svg>
          添加价格
        </a>
      </div>

      {/* Filters */}
      <form className='flex gap-3 items-center'>
        <input
          type='text'
          name='q'
          defaultValue={typeof params.q === 'string' ? params.q : ''}
          placeholder='搜索站点名...'
          className='flex-1 max-w-xs px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50'
        />
        <select
          name='model'
          defaultValue={typeof params.model === 'string' ? params.model : ''}
          className='px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50'
        >
          <option value=''>全部模型</option>
          {models.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
        <button type='submit' className='px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 text-sm rounded-lg transition-colors'>
          筛选
        </button>
      </form>

      {/* Table */}
      <div className='bg-gray-900/50 border border-gray-800/50 rounded-xl overflow-hidden'>
        <table className='w-full text-sm'>
          <thead>
            <tr className='border-b border-gray-800/50'>
              <th className='px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider'>站点</th>
              <th className='px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider'>模型</th>
              <th className='px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider'>价格</th>
              <th className='px-4 py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider'>在线率</th>
              <th className='px-4 py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider'>通过率</th>
              <th className='px-4 py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider'>掺水</th>
              <th className='px-4 py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider'>延迟</th>
              <th className='px-4 py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider'>评分</th>
              <th className='px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider'>操作</th>
            </tr>
          </thead>
          <tbody className='divide-y divide-gray-800/30'>
            {prices.map((p) => (
              <tr key={p.id} className='hover:bg-gray-800/20 transition-colors'>
                <td className='px-4 py-3'>
                  <a href={`/admin/sites/${p.site.id}/edit`} className='text-gray-200 hover:text-blue-400 transition-colors'>
                    {p.site.name}
                  </a>
                </td>
                <td className='px-4 py-3 font-mono text-gray-300'>{p.modelName}</td>
                <td className='px-4 py-3 text-right font-mono text-gray-200'>
                  ¥{p.price.toFixed(4)}
                  <span className='text-gray-500 text-xs ml-1'>/{p.priceUnit.replace('per_', '').replace('_', ' ')}</span>
                </td>
                <td className='px-4 py-3 text-center'>
                  {p.onlineRate != null ? (
                    <span className={p.onlineRate >= 99 ? 'text-emerald-400' : p.onlineRate >= 95 ? 'text-yellow-400' : 'text-red-400'}>
                      {p.onlineRate.toFixed(1)}%
                    </span>
                  ) : (
                    <span className='text-gray-600'>—</span>
                  )}
                </td>
                <td className='px-4 py-3 text-center'>
                  {p.passRate != null ? (
                    <span className={p.passRate >= 95 ? 'text-emerald-400' : p.passRate >= 80 ? 'text-yellow-400' : 'text-red-400'}>
                      {p.passRate.toFixed(1)}%
                    </span>
                  ) : (
                    <span className='text-gray-600'>—</span>
                  )}
                </td>
                <td className='px-4 py-3 text-center'>
                  {p.fakeRateBand ? (
                    <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full border ${BAND_COLORS[p.fakeRateBand] || ''}`}>
                      {p.fakeRateBand}
                    </span>
                  ) : (
                    <span className='text-gray-600'>—</span>
                  )}
                </td>
                <td className='px-4 py-3 text-center text-gray-300 font-mono'>
                  {p.avgLatencyMs != null ? `${p.avgLatencyMs}ms` : '—'}
                </td>
                <td className='px-4 py-3 text-center'>
                  {p.weightedScore != null ? (
                    <span className='text-blue-400 font-medium'>{p.weightedScore.toFixed(1)}</span>
                  ) : (
                    <span className='text-gray-600'>—</span>
                  )}
                </td>
                <td className='px-4 py-3'>
                  <PriceActions priceId={p.id} />
                </td>
              </tr>
            ))}
            {prices.length === 0 && (
              <tr>
                <td colSpan={9} className='px-4 py-12 text-center text-gray-500'>
                  没有找到匹配的价格记录
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
