/**
 * hvoy 在线同步逻辑 —— scripts/sync-hvoy.ts 与 api/cron/sync-hvoy/route.ts 共用
 *
 * @see specs/data-pipeline/spec.md §4（契约）/ §5（转换）/ §6（不变量）
 *
 * 行为对照原 scripts/sync-hvoy.mjs（迁移后不变），改用：
 * - zod 校验响应（spec §6 不变量 4：校验失败抛错）
 * - 集中转换函数（transform.ts）
 * - 结构化错误统计（spec plan 阶段 3：单点失败 errored++ 不拖垮整次同步）
 */
import { prisma } from '../prisma'
import {
  fetchJson,
  AllChannelsResponseSchema,
  ProvidersResponseSchema,
  SiteDetailResponseSchema,
  buildModelName,
  parseDate,
  domainFromUrl,
  fakeRateToBand,
  priceAnomaly,
  tampered,
  avgLatencyMs,
} from './index'

// ── 结果类型（spec plan 阶段 3：结构化错误统计）──
export interface QuickSyncResult {
  total: number
  updated: number
  skipped: number
  errored: number
  newHistory: number
  updatedAt: string | null
}

export interface FullSyncResult {
  providers: number
  siteUpserted: number
  siteSkipped: number
  channelUpdated: number
  errored: number
  quick?: QuickSyncResult
}

/** 构建 (domain\tmodelName) -> smpId 索引（对照 sync-hvoy.mjs buildProbeIndex） */
async function buildProbeIndex(): Promise<Map<string, number>> {
  const all = await prisma.siteModelPrice.findMany({
    select: { id: true, modelName: true, site: { select: { url: true } } },
  })
  const index = new Map<string, number>()
  for (const smp of all) {
    index.set(`${domainFromUrl(smp.site.url)}\t${smp.modelName}`, smp.id)
  }
  return index
}

/**
 * 快速同步：拉 all-channels，更新探针数据 + 价格趋势。适合 cron 高频调用。
 */
export async function quickSync(): Promise<QuickSyncResult> {
  const raw = await fetchJson('/__all-channels')
  const data = AllChannelsResponseSchema.parse(raw) // spec §6 不变量 4
  const channels = data.channels

  const index = await buildProbeIndex()
  let updated = 0
  let skipped = 0
  let errored = 0
  let newHistory = 0

  for (const c of channels) {
    const modelName = buildModelName(c.modelKey, c.channel)
    const smpId = index.get(`${c.siteDomain}\t${modelName}`)
    if (!smpId) {
      skipped++
      continue
    }

    try {
      await prisma.siteModelPrice.update({
        where: { id: smpId },
        data: {
          passRate: c.passRate ?? null,
          onlineRate: c.onlineRate ?? null,
          avgLatencyMs: avgLatencyMs(c.avgLatencyS),
          weightedScore: c.weightedScore ?? null,
          tokenUsageRatio: c.tokenUsageRatio ?? null,
          sampleCount: c.sampleCount ?? null,
          recentOnlineSeq: c.recentOnlineSeq ?? null,
          verificationType: c.verificationType ?? null,
        },
      })
      updated++

      // 价格趋势增量：只插入比已有最新记录更晚的点（spec §6 不变量 5）
      const trend = c.priceTrend ?? []
      if (trend.length > 0) {
        const latest = await prisma.priceHistory.findFirst({
          where: { siteModelPriceId: smpId },
          orderBy: { recordedAt: 'desc' },
        })
        const cutoff = latest?.recordedAt
        const newData = trend
          .map((t) => ({ at: parseDate(t.at), priceCny: t.priceCny }))
          .filter((t): t is { at: Date; priceCny: number } => t.at !== null && (!cutoff || t.at > cutoff))
          .map((t) => ({
            siteModelPriceId: smpId,
            price: typeof t.priceCny === 'number' ? t.priceCny : 0,
            recordedAt: t.at,
          }))
          .filter((h) => h.price >= 0)
        if (newData.length > 0) {
          await prisma.priceHistory.createMany({ data: newData })
          newHistory += newData.length
        }
      }
    } catch {
      errored++ // 单点失败不拖垮整次同步（spec plan 阶段 3）
    }
  }

  return {
    total: channels.length,
    updated,
    skipped,
    errored,
    newHistory,
    updatedAt: data.updatedAt ?? null,
  }
}

function slugOf(url: string): string {
  return domainFromUrl(url).replace(/[^a-z0-9]/gi, '')
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

/**
 * 全量同步：拉 providers + 逐站点 detail，增量 upsert 站点和价格。每天一次。
 * 末尾追加一次 quickSync 补充 all-channels 探针数据（对照原 sync-hvoy.mjs）。
 */
export async function fullSync(): Promise<FullSyncResult> {
  const providersData = ProvidersResponseSchema.parse(await fetchJson('/__providers'))
  const providers = providersData.providers

  const existingSites = await prisma.site.findMany({ select: { id: true, url: true, name: true } })
  const domainToSite = new Map<string, { id: number; name: string; url: string }>()
  for (const s of existingSites) {
    domainToSite.set(domainFromUrl(s.url), { id: s.id, name: s.name, url: s.url })
  }

  let siteUpserted = 0
  let siteSkipped = 0
  let channelUpdated = 0
  let errored = 0

  for (let i = 0; i < providers.length; i++) {
    const p = providers[i]
    const domain = domainFromUrl(p.url)
    const slug = slugOf(p.url)
    if (!domain || !slug) {
      siteSkipped++
      continue
    }

    let siteId = domainToSite.get(domain)?.id
    if (!siteId) {
      const created = await prisma.site.create({
        data: {
          name: p.name,
          url: p.url,
          description: null,
          isFree: false,
          status: 'online',
          paymentMethods: '',
          hasInvoice: false,
        },
      })
      siteId = created.id
      domainToSite.set(domain, { id: siteId, name: p.name, url: p.url })
      siteUpserted++
    }

    let detail
    try {
      detail = SiteDetailResponseSchema.parse(await fetchJson(`/__site-detail/${encodeURIComponent(slug)}`))
    } catch {
      errored++
      continue
    }
    if (!detail.ok) {
      errored++
      continue
    }

    try {
      for (const model of detail.models) {
        for (const ch of model.channels) {
          const base = ch.providerModelId || model.modelKey
          if (!base) continue
          const modelName = buildModelName(base, ch.channelName)
          const fakeRate = ch.fakeRate

          await prisma.siteModelPrice.upsert({
            where: { siteId_modelName: { siteId, modelName } },
            create: {
              siteId,
              modelName,
              price: ch.latestInputPriceCny ?? 0,
              priceOutput: ch.outputPriceCny ?? null,
              priceCached: ch.cacheInputPriceCny ?? null,
              priceCacheCreate: ch.cacheCreatePriceCny ?? null,
              passRate: ch.passRate ?? null,
              onlineRate: ch.onlineRate ?? null,
              fakeRateBand: fakeRateToBand(fakeRate),
              avgLatencyMs: avgLatencyMs(ch.avgLatencyS),
              lastProbedAt: parseDate(ch.lastProbedAt),
              priceAnomaly: priceAnomaly(fakeRate, ch.passRate),
              tampered: tampered(fakeRate),
            },
            update: {
              price: ch.latestInputPriceCny ?? undefined,
              priceOutput: ch.outputPriceCny ?? undefined,
              priceCached: ch.cacheInputPriceCny ?? undefined,
              priceCacheCreate: ch.cacheCreatePriceCny ?? undefined,
              passRate: ch.passRate ?? undefined,
              onlineRate: ch.onlineRate ?? undefined,
              fakeRateBand: fakeRate != null ? fakeRateToBand(fakeRate) : undefined,
              avgLatencyMs: avgLatencyMs(ch.avgLatencyS) ?? undefined,
              lastProbedAt: parseDate(ch.lastProbedAt) ?? undefined,
              priceAnomaly: priceAnomaly(fakeRate, ch.passRate),
              tampered: tampered(fakeRate),
            },
          })
          channelUpdated++
        }
      }
    } catch {
      errored++ // 单站点 upsert 失败不拖垮全量（spec plan 阶段 3）
    }

    if ((i + 1) % 50 === 0) {
      console.log(`  已处理 ${i + 1}/${providers.length} 站点...`)
    }
    await sleep(200) // 限流，避免被封
  }

  // 全量同步后，跑一次快速同步补充 all-channels 探针数据
  const quick = await quickSync()

  return {
    providers: providers.length,
    siteUpserted,
    siteSkipped,
    channelUpdated,
    errored,
    quick,
  }
}
