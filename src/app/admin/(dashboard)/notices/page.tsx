import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import ConfirmDelete from '@/app/admin/_components/ConfirmDelete'
import { deleteNotice } from './actions'

export const dynamic = 'force-dynamic'

const PAGE_SIZE = 30

const TAG_STYLE: Record<string, string> = {
  important: 'border-red-200 bg-red-50 text-red-600',
  maintenance: 'border-amber-200 bg-amber-50 text-amber-700',
  update: 'border-brand-200 bg-brand-50 text-brand-700',
  pricing: 'border-violet-200 bg-violet-50 text-violet-700',
  promotion: 'border-sky-200 bg-sky-50 text-sky-700',
  notice: 'border-stone-200 bg-stone-50 text-stone-600',
}

export default async function AdminNoticesPage({
  searchParams,
}: {
  searchParams: Promise<{ site?: string; page?: string }>
}) {
  const sp = await searchParams
  const siteId = sp.site ? Number(sp.site) : NaN
  const page = Math.max(1, Number(sp.page ?? 1) || 1)
  const where = Number.isFinite(siteId) ? { siteId } : {}

  const [total, notices, sites] = await Promise.all([
    prisma.relayNotice.count({ where }),
    prisma.relayNotice.findMany({
      where,
      orderBy: { fetchedAt: 'desc' },
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
      include: { site: { select: { name: true } } },
    }),
    prisma.site.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } }),
  ])

  return (
    <div className='space-y-5'>
      <div className='flex items-center justify-between flex-wrap gap-3'>
        <div>
          <h1 className='text-2xl font-bold tracking-tight'>公告管理</h1>
          <p className='text-sm text-stone-500 mt-1'>共 {total} 条公告</p>
        </div>
        <Link href='/admin/notices/new' className='mj-btn-primary'>+ 发布公告</Link>
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

      {notices.length === 0 ? (
        <div className='mj-card p-12 text-center text-stone-400 text-sm'>暂无公告</div>
      ) : (
        <div className='space-y-3'>
          {notices.map((n) => (
            <div key={n.id} className='mj-card p-4'>
              <div className='flex items-center justify-between gap-3 mb-2'>
                <div className='flex items-center gap-2 min-w-0'>
                  <span className={`mj-badge ${TAG_STYLE[n.tagCategory] ?? TAG_STYLE.notice}`}>
                    {n.tagCategory}
                  </span>
                  <span className='text-xs text-stone-400 truncate'>@ {n.site.name}</span>
                  <span className='text-xs text-stone-400'>· {n.sourceType}</span>
                </div>
                <span className='text-xs text-stone-400 mj-mono shrink-0'>
                  {new Date(n.fetchedAt).toLocaleDateString('zh-CN')}
                </span>
              </div>
              <p className='text-sm text-stone-700 leading-relaxed line-clamp-3'>{n.noticeText}</p>
              {n.noticeUrl && (
                <a
                  href={n.noticeUrl}
                  target='_blank'
                  rel='noreferrer'
                  className='text-xs text-brand-600 hover:text-brand-700 mt-1.5 inline-block'
                >
                  原文链接 ↗
                </a>
              )}
              <div className='mt-3 flex justify-end gap-3'>
                <Link href={`/admin/notices/${n.id}`} className='text-xs text-brand-600 hover:text-brand-700'>
                  编辑
                </Link>
                <ConfirmDelete
                  action={() => deleteNotice(n.id)}
                  label='删除'
                  message='确认删除该公告？'
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
