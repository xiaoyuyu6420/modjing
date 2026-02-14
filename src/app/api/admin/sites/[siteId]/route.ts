import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ siteId: string }> }
) {
  const { siteId } = await params
  const body = await request.json()

  const site = await prisma.site.update({
    where: { id: parseInt(siteId) },
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

  return NextResponse.json(site)
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ siteId: string }> }
) {
  const { siteId } = await params
  const id = parseInt(siteId)

  // Delete related records first
  await prisma.$transaction([
    prisma.priceHistory.deleteMany({ where: { siteModelPrice: { siteId: id } } }),
    prisma.siteModelPrice.deleteMany({ where: { siteId: id } }),
    prisma.healthCheck.deleteMany({ where: { siteId: id } }),
    prisma.review.deleteMany({ where: { siteId: id } }),
    prisma.relayNotice.deleteMany({ where: { siteId: id } }),
    prisma.site.delete({ where: { id } }),
  ])

  return NextResponse.json({ ok: true })
}
