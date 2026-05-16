import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const HVOY_BASE = 'https://hvoy.ai'

function domainFromUrl(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return ''
  }
}

/**
 * 快速同步 all-channels：更新探针数据 + 价格趋势
 * 适合 cron 高频调用（~1-2秒）
 */
async function quickSync() {
  const res = await fetch(`${HVOY_BASE}/__all-channels`, {
    headers: { Accept: 'application/json' },
  })
  if (!res.ok) throw new Error(`hvoy __all-channels -> HTTP ${res.status}`)
  const data = await res.json()
  const channels: any[] = data.channels || []

  // 构建 (domain, modelName) -> smpId 索引
  const all = await prisma.siteModelPrice.findMany({
    select: { id: true, modelName: true, site: { select: { url: true } } },
  })
  const index = new Map<string, number>()
  for (const smp of all) {
    index.set(`${domainFromUrl(smp.site.url)}\t${smp.modelName}`, smp.id)
  }

  let updated = 0
  let skipped = 0
  let newHistory = 0

  for (const c of channels) {
    const domain = c.siteDomain
    const modelName = `${c.modelKey}@${c.channel || 'default'}`
    const smpId = index.get(`${domain}\t${modelName}`)
    if (!smpId) {
      skipped++
      continue
    }

    const avgLatencyMs =
      typeof c.avgLatencyS === 'number' ? Math.round(c.avgLatencyS * 1000) : null

    await prisma.siteModelPrice.update({
      where: { id: smpId },
      data: {
        passRate: typeof c.passRate === 'number' ? c.passRate : null,
        onlineRate: typeof c.onlineRate === 'number' ? c.onlineRate : null,
        avgLatencyMs,
        weightedScore: typeof c.weightedScore === 'number' ? c.weightedScore : null,
        tokenUsageRatio: typeof c.tokenUsageRatio === 'number' ? c.tokenUsageRatio : null,
        sampleCount: typeof c.sampleCount === 'number' ? c.sampleCount : null,
        recentOnlineSeq: c.recentOnlineSeq || null,
        verificationType: c.verificationType || null,
      },
    })
    updated++

    const trend: any[] = Array.isArray(c.priceTrend) ? c.priceTrend : []
    if (trend.length > 0) {
      const latest = await prisma.priceHistory.findFirst({
        where: { siteModelPriceId: smpId },
        orderBy: { recordedAt: 'desc' },
      })
      const cutoff = latest?.recordedAt
      const newData = trend
        .filter((t) => {
          if (!cutoff) return true
          const d = new Date(t.at)
          return !Number.isNaN(d.getTime()) && d > cutoff
        })
        .map((t) => ({
          siteModelPriceId: smpId,
          price: typeof t.priceCny === 'number' ? t.priceCny : 0,
          recordedAt: new Date(t.at),
        }))
        .filter((h) => h.price >= 0)
      if (newData.length > 0) {
        await prisma.priceHistory.createMany({ data: newData })
        newHistory += newData.length
      }
    }
  }

  return { total: channels.length, updated, skipped, newHistory, updatedAt: data.updatedAt }
}

export async function GET(req: NextRequest) {
  // 密钥保护：通过 CRON_SECRET 环境变量或 query 参数验证
  const authHeader = req.headers.get('authorization')
  const secret = process.env.CRON_SECRET
  const querySecret = req.nextUrl.searchParams.get('secret')

  if (secret) {
    const provided = authHeader?.replace('Bearer ', '') || querySecret
    if (provided !== secret) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }
  }

  try {
    const result = await quickSync()
    return NextResponse.json({ ok: true, ...result })
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 })
  }
}
