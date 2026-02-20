import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const body = await request.json()

  if (!body.siteId || !body.modelName || body.price == null) {
    return NextResponse.json({ error: '站点、模型、价格必填' }, { status: 400 })
  }

  const price = await prisma.siteModelPrice.create({
    data: {
      siteId: body.siteId,
      modelName: body.modelName,
      price: body.price,
      priceUnit: body.priceUnit || 'per_million_tokens',
      multiplier: body.multiplier || 1.0,
      afterSales: body.afterSales || 'none',
    },
  })

  return NextResponse.json(price, { status: 201 })
}

export async function GET() {
  const prices = await prisma.siteModelPrice.findMany({
    include: { site: { select: { name: true } } },
    orderBy: { modelName: 'asc' },
  })
  return NextResponse.json(prices)
}
