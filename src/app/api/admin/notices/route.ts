import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const body = await request.json()

  if (!body.siteId || !body.noticeText) {
    return NextResponse.json({ error: '站点和公告内容必填' }, { status: 400 })
  }

  const notice = await prisma.relayNotice.create({
    data: {
      siteId: body.siteId,
      noticeText: body.noticeText,
      noticeUrl: body.noticeUrl || null,
      tagCategory: body.tagCategory || 'notice',
      sourceType: body.sourceType || 'manual',
      publishedAt: body.publishedAt ? new Date(body.publishedAt) : null,
    },
  })

  return NextResponse.json(notice, { status: 201 })
}
