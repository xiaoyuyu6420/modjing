import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ noticeId: string }> }
) {
  const { noticeId } = await params
  await prisma.relayNotice.delete({ where: { id: parseInt(noticeId) } })
  return NextResponse.json({ ok: true })
}
