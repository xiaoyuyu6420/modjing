import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { StatusBadge } from '@/components/ui/StatusBadge'
import SiteRowActions from './_components/SiteRowActions'

export const dynamic = 'force-dynamic'

const PAGE_SIZE = 25

export default async function AdminSitesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>
}) {
  const sp = await searchParams
  const q = String(sp.q ?? '').trim()
  const status = String(sp.status ?? 'all')
  const page = Math.max(1, Number(sp.page ?? 1) || 1)

  const where = {
    ...(q ? { OR: [{ name: { contains: q } }, { url: { contains: q } }] } : {}),
    ...(status !== 'all' ? { status } : {}),
  }

  const [total, sites] = await Promise.all([
    prisma.site.count({ where }),
    prisma.site.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
      include: { _count: { select: { modelPrices: true, reviews: true } } },
    }),
  ])

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <div className='space-y-5'>
      <div className='flex items-center justify-between flex-wrap gap-3'>
        <div>
          <h1 className='text-2xl font-bold tracking-tight'>站点管理</h1>
          <p className='text-sm text-stone-500 mt-1'>共 {total} 个站点</p>
        </div>
        <Link href='/admin/sites/new' className='mj-btn-primary'>
          + 新建站点
        </Link>
      </div>

      <form className='flex flex-wrap items-center gap-2'>
        <input
          name='q'
          defaultValue={q}
          placeholder='搜站点名 / URL'
          className='mj-input flex-1 min-w-[200px] max-w-xs'
        />
        <select name='status' defaultValue={status} className='mj-select'>
          <option value='all'>全部状态</option>
          <option value='online'>在线</option>
          <option value='unstable'>不稳定</option>
          <option value='offline'>离线</option>
        </select>
        <button type='submit' className='mj-btn-ghost'>
          筛选
        </button>
        {(q || status !== 'all') && (
          <Link href='/admin/sites' className='text-xs text-stone-400 hover:text-stone-600'>
            清除
          </Link>
        )}
      </form>

      <div className='mj-table-wrap'>
        <table className='mj-table'>
          <thead>
            <tr>
              <th className='mj-th'>站点</th>
              <th className='mj-th'>状态</th>
              <th className='mj-th text-right'>模型</th>
              <th className='mj-th text-right'>评价</th>
              <th className='mj-th'>收录</th>
              <th className='mj-th text-right'>操作</th>
            </tr>
          </thead>
          <tbody>
            {sites.length === 0 ? (
              <tr>
                <td colSpan={6} className='py-12 text-center text-stone-400'>
                  没有匹配的站点
                </td>
              </tr>
            ) : (
              sites.map((s) => (
                <tr key={s.id} className='mj-row'>
                  <td className='mj-td'>
                    <Link
                      href={`/admin/sites/${s.id}`}
                      className='font-medium text-stone-900 hover:text-brand-700'
                    >
                      {s.name}
                    </Link>
                    <a
                      href={s.url}
                      target='_blank'
                      rel='noreferrer'
                      className='ml-2 text-xs text-stone-400 hover:text-stone-600'
                    >
                      {s.url.replace(/^https?:\/\//, '')} ↗
                    </a>
                    {s.isFree && (
                      <span className='ml-2 mj-badge border-brand-200 bg-brand-50 text-brand-700'>公益</span>
                    )}
                  </td>
                  <td className='mj-td'>
                    <StatusBadge status={s.status} />
                  </td>
                  <td className='mj-td text-right mj-mono text-stone-600'>{s._count.modelPrices}</td>
                  <td className='mj-td text-right mj-mono text-stone-600'>{s._count.reviews}</td>
                  <td className='mj-td text-stone-400 text-xs mj-mono'>
                    {new Date(s.createdAt).toLocaleDateString('zh-CN')}
                  </td>
                  <td className='mj-td'>
                    <SiteRowActions id={s.id} status={s.status} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <div className='flex items-center justify-center gap-2 text-sm'>
          <PageLink page={page - 1} disabled={page <= 1} q={q} status={status}>
            上一页
          </PageLink>
          <span className='text-stone-500 mj-mono'>
            {page} / {pages}
          </span>
          <PageLink page={page + 1} disabled={page >= pages} q={q} status={status}>
            下一页
          </PageLink>
        </div>
      )}
    </div>
  )
}

function PageLink({
  page,
  disabled,
  q,
  status,
  children,
}: {
  page: number
  disabled: boolean
  q: string
  status: string
  children: React.ReactNode
}) {
  const params = new URLSearchParams()
  if (q) params.set('q', q)
  if (status !== 'all') params.set('status', status)
  params.set('page', String(page))
  return (
    <Link
      href={`/admin/sites?${params.toString()}`}
      aria-disabled={disabled}
      className={`px-3 py-1.5 border border-stone-300 rounded-lg bg-white text-stone-600 hover:bg-stone-50 ${
        disabled ? 'opacity-40 pointer-events-none' : ''
      }`}
    >
      {children}
    </Link>
  )
}
