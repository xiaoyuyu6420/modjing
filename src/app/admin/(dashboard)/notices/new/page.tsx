import { prisma } from '@/lib/prisma'
import NoticeForm from '../_components/NoticeForm'
import { createNotice } from '../actions'

export const dynamic = 'force-dynamic'

export default async function NewNoticePage() {
  const sites = await prisma.site.findMany({
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  })
  return <NoticeForm sites={sites} action={createNotice} />
}
