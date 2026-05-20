import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { runProbe } from '@/lib/probe'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

/**
 * 触发一次探针检测
 *
 * POST /api/probe
 * body: { siteModelPriceId, apiKey, baseUrl?, model? }
 *
 * 需要管理员权限（CRON_SECRET 或 ADMIN_PASSWORD）
 */
export async function POST(req: NextRequest) {
  // 权限校验
  const secret = process.env.CRON_SECRET || process.env.ADMIN_PASSWORD
  if (secret) {
    const auth = req.headers.get('authorization')?.replace('Bearer ', '')
    const body = await req.clone().json().catch(() => ({}))
    const provided = auth || body.token
    if (provided !== secret) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }
  }

  const body = await req.json()
  const { siteModelPriceId, apiKey, baseUrl, model } = body

  if (!siteModelPriceId || !apiKey) {
    return NextResponse.json(
      { error: '缺少 siteModelPriceId 或 apiKey' },
      { status: 400 },
    )
  }

  // 从数据库拿渠道信息
  const smp = await prisma.siteModelPrice.findUnique({
    where: { id: Number(siteModelPriceId) },
    include: { site: { select: { url: true } } },
  })
  if (!smp) {
    return NextResponse.json({ error: '渠道不存在' }, { status: 404 })
  }

  // model 从 modelName 提取 base（去掉 @channel）
  const modelToProbe = model || smp.modelName.split('@')[0]
  // baseUrl 优先用传入的，否则用站点 url
  const urlToProbe = baseUrl || smp.site.url

  try {
    const result = await runProbe({
      baseUrl: urlToProbe,
      apiKey,
      model: modelToProbe,
    })

    // 存入 ProbeResult
    const saved = await prisma.probeResult.create({
      data: {
        siteModelPriceId: smp.id,
        score: result.score,
        verdict: result.verdict,
        tokenUsageRatio: result.tokenUsageRatio,
        latencyMs: result.latencyMs,
        details: JSON.stringify(result.details),
        source: 'modjing',
      },
    })

    return NextResponse.json({ ok: true, probeId: saved.id, ...result })
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    )
  }
}
