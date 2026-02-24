import { prisma } from '@/lib/prisma'
import NoticeActions from './notice-actions'

async function getNotices() {
  return prisma.relayNotice.findMany({
    orderBy: { fetchedAt: 'desc' },
    include: { site: { select: { id: true, name: true } } },
  })
}

const TAG_COLORS: Record<string, string> = {
  important: 'bg-red-500/10 text-red-400 border-red-500/20',
  maintenance: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  update: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  pricing: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  promotion: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  notice: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
}

const TAG_LABELS: Record<string, string> = {
  important: '重要',
  maintenance: '维护',
  update: '更新',
  pricing: '调价',
  promotion: '促销',
  notice: '通知',
}

export default async function AdminNotices() {
  const notices = await getNotices()

  return (
    <div className='p-8 space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold text-gray-100'>公告管理</h1>
          <p className='text-sm text-gray-500 mt-1'>共 {notices.length} 条公告</p>
        </div>
        <a
          href='/admin/notices/new'
          className='px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2'
        >
          <svg className='w-4 h-4' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2}>
            <path strokeLinecap='round' strokeLinejoin='round' d='M12 4.5v15m7.5-7.5h-15' />
          </svg>
          添加公告
        </a>
      </div>

      <div className='space-y-3'>
        {notices.map((notice) => (
          <div key={notice.id} className='bg-gray-900/50 border border-gray-800/50 rounded-xl p-5'>
            <div className='flex items-start justify-between gap-4'>
              <div className='flex-1 min-w-0'>
                <div className='flex items-center gap-2 mb-2'>
                  <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full border ${TAG_COLORS[notice.tagCategory] || TAG_COLORS.notice}`}>
                    {TAG_LABELS[notice.tagCategory] || notice.tagCategory}
                  </span>
                  <a href={`/admin/sites/${notice.site.id}/edit`} className='text-xs text-blue-400 hover:text-blue-300'>
                    {notice.site.name}
                  </a>
                  <span className='text-xs text-gray-500'>
                    {notice.sourceType === 'manual' ? '手动' : notice.sourceType === 'hvoy' ? 'hvoy' : '爬取'}
                  </span>
                </div>
                <p className='text-sm text-gray-300 leading-relaxed'>{notice.noticeText}</p>
                {notice.noticeUrl && (
                  <a href={notice.noticeUrl} target='_blank' rel='noopener' className='text-xs text-blue-400 hover:underline mt-1 inline-block'>
                    查看链接 →
                  </a>
                )}
                <div className='text-xs text-gray-500 mt-2'>
                  {notice.publishedAt ? new Date(notice.publishedAt).toLocaleString('zh-CN') : '未设置发布时间'}
                  {' · '}
                  抓取于 {new Date(notice.fetchedAt).toLocaleString('zh-CN')}
                </div>
              </div>
              <NoticeActions noticeId={notice.id} />
            </div>
          </div>
        ))}
        {notices.length === 0 && (
          <div className='text-center py-12 text-gray-500'>暂无公告</div>
        )}
      </div>
    </div>
  )
}
