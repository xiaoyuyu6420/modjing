import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import NoticeForm from '../_components/NoticeForm'
import { updateNotice } from '../actions'

export const dynamic = 'force-dynamic'

export default async function EditNoticePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const noticeId = Number(id)
  if (!Number.isFinite(noticeId)) notFound()

  const [notice, sites] = await Promise.all([
    prisma.relayNotice.findUnique({ where: { id: noticeId } }),
    prisma.site.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } }),
  ])
  if (!notice) notFound()

  return (
    <NoticeForm
      sites={sites}
      notice={{
        siteId: notice.siteId,
        sourceType: notice.sourceType,
        noticeText: notice.noticeText,
        noticeUrl: notice.noticeUrl,
        tagCategory: notice.tagCategory,
        publishedAt: notice.publishedAt,
      }}
      action={updateNotice.bind(null, noticeId)}
    />
  )
}
