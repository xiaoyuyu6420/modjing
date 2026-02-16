import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const body = await request.json()

  if (!body.name || !body.url) {
    return NextResponse.json({ error: '名称和 URL 必填' }, { status: 400 })
  }

  const site = await prisma.site.create({
    data: {
      name: body.name,
      url: body.url,
      logo: body.logo || null,
      description: body.description || null,
      announcement: body.announcement || null,
      isFree: body.isFree || false,
      status: body.status || 'online',
      paymentMethods: body.paymentMethods || '',
      hasInvoice: body.hasInvoice || false,
      complianceLevel: body.complianceLevel || null,
      dataLocation: body.dataLocation || null,
    },
  })

  return NextResponse.json(site, { status: 201 })
}
