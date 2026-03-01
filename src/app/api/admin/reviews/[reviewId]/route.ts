import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ reviewId: string }> }
) {
  const { reviewId } = await params
  await prisma.review.delete({ where: { id: parseInt(reviewId) } })
  return NextResponse.json({ ok: true })
}
