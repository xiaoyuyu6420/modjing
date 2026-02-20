import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ priceId: string }> }
) {
  const { priceId } = await params
  const body = await request.json()

  const price = await prisma.siteModelPrice.update({
    where: { id: parseInt(priceId) },
    data: {
      price: body.price,
      priceUnit: body.priceUnit,
      multiplier: body.multiplier,
      afterSales: body.afterSales,
    },
  })

  return NextResponse.json(price)
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ priceId: string }> }
) {
  const { priceId } = await params
  const id = parseInt(priceId)

  await prisma.$transaction([
    prisma.priceHistory.deleteMany({ where: { siteModelPriceId: id } }),
    prisma.siteModelPrice.delete({ where: { id } }),
  ])

  return NextResponse.json({ ok: true })
}
