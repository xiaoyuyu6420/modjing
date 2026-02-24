import { prisma } from '@/lib/prisma'
import ReviewActions from './review-actions'

async function getReviews() {
  return prisma.review.findMany({
    orderBy: { createdAt: 'desc' },
    include: { site: { select: { id: true, name: true } } },
  })
}

export default async function AdminReviews() {
  const reviews = await getReviews()

  return (
    <div className='p-8 space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold text-gray-100'>评价管理</h1>
          <p className='text-sm text-gray-500 mt-1'>共 {reviews.length} 条评价</p>
        </div>
      </div>

      <div className='space-y-3'>
        {reviews.map((review) => (
          <div key={review.id} className='bg-gray-900/50 border border-gray-800/50 rounded-xl p-5'>
            <div className='flex items-start justify-between'>
              <div className='flex items-start gap-3'>
                <div className='w-9 h-9 rounded-full bg-gray-700 flex items-center justify-center text-sm font-bold text-gray-300 shrink-0'>
                  {review.author.charAt(0)}
                </div>
                <div>
                  <div className='flex items-center gap-2'>
                    <span className='font-medium text-gray-200'>{review.author}</span>
                    <span className='text-xs text-gray-500'>评价</span>
                    <a href={`/admin/sites/${review.site.id}/edit`} className='text-xs text-blue-400 hover:text-blue-300'>
                      {review.site.name}
                    </a>
                    <span className='text-xs text-yellow-400'>{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</span>
                  </div>
                  <p className='text-sm text-gray-300 mt-2 leading-relaxed'>{review.content}</p>
                  <div className='text-xs text-gray-500 mt-2'>
                    {new Date(review.createdAt).toLocaleString('zh-CN')}
                  </div>
                </div>
              </div>
              <ReviewActions reviewId={review.id} />
            </div>
          </div>
        ))}
        {reviews.length === 0 && (
          <div className='text-center py-12 text-gray-500'>暂无评价</div>
        )}
      </div>
    </div>
  )
}
