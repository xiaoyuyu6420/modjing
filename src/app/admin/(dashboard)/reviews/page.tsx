import { prisma } from '@/lib/prisma'
import ConfirmDelete from '@/app/admin/_components/ConfirmDelete'
import { deleteReview } from './actions'

export const dynamic = 'force-dynamic'

const PAGE_SIZE = 30

export default async function AdminReviewsPage({
  searchParams,
}: {
  searchParams: Promise<{ site?: string; page?: string }>
}) {
  const sp = await searchParams
  const siteId = sp.site ? Number(sp.site) : NaN
  const page = Math.max(1, Number(sp.page ?? 1) || 1)
  const where = Number.isFinite(siteId) ? { siteId } : {}

  const [total, reviews, sites] = await Promise.all([
    prisma.review.count({ where }),
    prisma.review.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
      include: { site: { select: { name: true } } },
    }),
    prisma.site.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } }),
  ])

  return (
    <div className='space-y-5'>
      <div>
        <h1 className='text-2xl font-bold tracking-tight'>评价管理</h1>
        <p className='text-sm text-stone-500 mt-1'>共 {total} 条用户评价</p>
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

      {reviews.length === 0 ? (
        <div className='mj-card p-12 text-center text-stone-400 text-sm'>暂无评价</div>
      ) : (
        <div className='space-y-3'>
          {reviews.map((r) => (
            <div key={r.id} className='mj-card p-4'>
              <div className='flex items-center justify-between gap-3 mb-2'>
                <div className='flex items-center gap-2 min-w-0'>
                  <span className='font-medium text-stone-900'>{r.author}</span>
                  <span className='text-amber-500 text-sm mj-mono'>★{r.rating}</span>
                  <span className='text-xs text-stone-400 truncate'>@ {r.site.name}</span>
                </div>
                <span className='text-xs text-stone-400 mj-mono shrink-0'>
                  {new Date(r.createdAt).toLocaleString('zh-CN')}
                </span>
              </div>
              <p className='text-sm text-stone-600 leading-relaxed'>{r.content}</p>
              <div className='mt-3 flex justify-end'>
                <ConfirmDelete
                  action={() => deleteReview(r.id)}
                  label='删除评价'
                  message='确认删除该评价？'
                  className='text-xs text-red-600 hover:text-red-700'
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
