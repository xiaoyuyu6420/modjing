import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ siteId: string }> }
) {
  const { siteId } = await params
  const body = await request.json()

  if (!['online', 'unstable', 'offline'].includes(body.status)) {
    return NextResponse.json({ error: '无效状态' }, { status: 400 })
  }

  await prisma.site.update({
    where: { id: parseInt(siteId) },
    data: { status: body.status },
  })

  return NextResponse.json({ ok: true })
}
