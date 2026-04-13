import { prisma } from '@/lib/prisma'
import ConfirmDelete from '@/app/admin/_components/ConfirmDelete'
import { deleteHealth } from './actions'

export const dynamic = 'force-dynamic'

const PAGE_SIZE = 40

const STATUS_STYLE: Record<string, string> = {
  ok: 'border-brand-200 bg-brand-50 text-brand-700',
  slow: 'border-amber-200 bg-amber-50 text-amber-700',
  timeout: 'border-orange-200 bg-orange-50 text-orange-700',
  error: 'border-red-200 bg-red-50 text-red-600',
}

export default async function AdminHealthPage({
  searchParams,
}: {
  searchParams: Promise<{ site?: string; page?: string }>
}) {
  const sp = await searchParams
  const siteId = sp.site ? Number(sp.site) : NaN
  const page = Math.max(1, Number(sp.page ?? 1) || 1)
  const where = Number.isFinite(siteId) ? { siteId } : {}

  const [total, checks, sites] = await Promise.all([
    prisma.healthCheck.count({ where }),
    prisma.healthCheck.findMany({
      where,
      orderBy: { checkedAt: 'desc' },
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
      include: { site: { select: { name: true } } },
    }),
    prisma.site.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } }),
  ])

  return (
    <div className='space-y-5'>
      <div>
        <h1 className='text-2xl font-bold tracking-tight'>健康监控</h1>
        <p className='text-sm text-stone-500 mt-1'>共 {total} 条健康检查记录</p>
      </div>

      <form className='flex items-center gap-2'>
        <select name='site' defaultValue={Number.isFinite(siteId) ? String(siteId) : ''} className='mj-select max-w-[200px]'>
          <option value=''>全部站点</option>
          {sites.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
        <button type='submit' className='mj-btn-ghost'>筛选</button>
      </form>

      <div className='mj-table-wrap'>
        <table className='mj-table'>
          <thead>
            <tr>
              <th className='mj-th'>站点</th>
              <th className='mj-th'>状态</th>
              <th className='mj-th text-right'>延迟</th>
              <th className='mj-th'>检查时间</th>
              <th className='mj-th text-right'>操作</th>
            </tr>
          </thead>
          <tbody>
            {checks.length === 0 ? (
              <tr>
                <td colSpan={5} className='py-12 text-center text-stone-400'>暂无记录</td>
              </tr>
            ) : (
              checks.map((c) => (
                <tr key={c.id} className='mj-row'>
                  <td className='mj-td font-medium text-stone-900'>{c.site.name}</td>
                  <td className='mj-td'>
                    <span className={`mj-badge ${STATUS_STYLE[c.status] ?? STATUS_STYLE.error}`}>
                      {c.status}
                    </span>
                  </td>
                  <td className='mj-td text-right mj-mono text-stone-600'>{c.latency}ms</td>
                  <td className='mj-td text-stone-400 text-xs mj-mono'>
                    {new Date(c.checkedAt).toLocaleString('zh-CN')}
                  </td>
                  <td className='mj-td text-right'>
                    <ConfirmDelete
                      action={() => deleteHealth(c.id)}
                      label='删除'
                      message='确认删除该记录？'
                      className='text-xs text-red-600 hover:text-red-700'
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
