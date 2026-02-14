import { prisma } from '@/lib/prisma'
import SiteActions from './site-actions'

async function getSites(searchParams: { [key: string]: string | string[] | undefined }) {
  const q = typeof searchParams.q === 'string' ? searchParams.q : undefined
  const status = typeof searchParams.status === 'string' ? searchParams.status : undefined

  const where: Record<string, unknown> = {}
  if (q) {
    where.OR = [
      { name: { contains: q } },
      { url: { contains: q } },
      { description: { contains: q } },
    ]
  }
  if (status && status !== 'all') {
    where.status = status
  }

  const sites = await prisma.site.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { modelPrices: true, reviews: true, healthChecks: true } },
    },
  })

  return sites
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  online: { label: '在线', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  unstable: { label: '不稳定', color: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' },
  offline: { label: '已下线', color: 'bg-red-500/10 text-red-400 border-red-500/20' },
}

export default async function AdminSites({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams
  const sites = await getSites(params)

  return (
    <div className='p-8 space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold text-gray-100'>站点管理</h1>
          <p className='text-sm text-gray-500 mt-1'>共 {sites.length} 个站点</p>
        </div>
        <a
          href='/admin/sites/new'
          className='px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2'
        >
          <svg className='w-4 h-4' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2}>
            <path strokeLinecap='round' strokeLinejoin='round' d='M12 4.5v15m7.5-7.5h-15' />
          </svg>
          添加站点
        </a>
      </div>

      {/* Filters */}
      <form className='flex gap-3 items-center'>
        <div className='relative flex-1 max-w-sm'>
          <svg className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2}>
            <path strokeLinecap='round' strokeLinejoin='round' d='M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z' />
          </svg>
          <input
            type='text'
            name='q'
            defaultValue={typeof params.q === 'string' ? params.q : ''}
            placeholder='搜索站点名称、URL...'
            className='w-full pl-10 pr-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50'
          />
        </div>
        <select
          name='status'
          defaultValue={typeof params.status === 'string' ? params.status : 'all'}
          className='px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50'
        >
          <option value='all'>全部状态</option>
          <option value='online'>在线</option>
          <option value='unstable'>不稳定</option>
          <option value='offline'>已下线</option>
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
              <th className='px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider'>状态</th>
              <th className='px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider'>类型</th>
              <th className='px-4 py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider'>价格</th>
              <th className='px-4 py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider'>评价</th>
              <th className='px-4 py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider'>健康</th>
              <th className='px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider'>操作</th>
            </tr>
          </thead>
          <tbody className='divide-y divide-gray-800/30'>
            {sites.map((site) => {
              const statusInfo = STATUS_LABELS[site.status] || STATUS_LABELS.online
              return (
                <tr key={site.id} className='hover:bg-gray-800/20 transition-colors'>
                  <td className='px-4 py-3'>
                    <div>
                      <div className='font-medium text-gray-200'>{site.name}</div>
                      <div className='text-xs text-gray-500'>{site.url}</div>
                    </div>
                  </td>
                  <td className='px-4 py-3'>
                    <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full border ${statusInfo.color}`}>
                      {statusInfo.label}
                    </span>
                  </td>
                  <td className='px-4 py-3'>
                    {site.isFree ? (
                      <span className='text-xs text-emerald-400 font-medium'>免费</span>
                    ) : (
                      <span className='text-xs text-gray-400'>付费</span>
                    )}
                  </td>
                  <td className='px-4 py-3 text-center text-gray-300'>{site._count.modelPrices}</td>
                  <td className='px-4 py-3 text-center text-gray-300'>{site._count.reviews}</td>
                  <td className='px-4 py-3 text-center text-gray-300'>{site._count.healthChecks}</td>
                  <td className='px-4 py-3'>
                    <SiteActions siteId={site.id} currentStatus={site.status} />
                  </td>
                </tr>
              )
            })}
            {sites.length === 0 && (
              <tr>
                <td colSpan={7} className='px-4 py-12 text-center text-gray-500'>
                  没有找到匹配的站点
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
