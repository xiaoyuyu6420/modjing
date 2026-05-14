/**
 * hvoy 数据增量同步脚本
 *
 * 用法：
 *   npm run sync-hvoy          快速同步：只拉 all-channels，更新探针数据（~3秒，适合 cron 高频）
 *   npm run sync-hvoy:full     全量同步：拉 providers + 逐站点 detail，增量更新站点和价格（~5分钟，每天一次）
 *
 * 设计原则：增量更新，不删除现有数据，保留后台手动标注。
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const HVOY_BASE = 'https://hvoy.ai'

function fakeRateToBand(rate) {
  if (rate == null) return null
  if (rate >= 25) return 'severe'
  if (rate >= 15) return 'light'
  if (rate >= 5) return 'low'
  return 'minimal'
}

function parseDate(value) {
  if (!value) return null
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? null : d
}

function domainFromUrl(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return ''
  }
}

async function fetchJson(path) {
  const res = await fetch(`${HVOY_BASE}${path}`, {
    headers: { Accept: 'application/json' },
  })
  if (!res.ok) throw new Error(`${path} -> HTTP ${res.status}`)
  return res.json()
}

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

/**
 * 构建 (siteDomain, modelKey@channel) -> smpId 索引
 */
async function buildProbeIndex() {
  const all = await prisma.siteModelPrice.findMany({
    select: { id: true, modelName: true, site: { select: { url: true } } },
  })
  const index = new Map()
  for (const smp of all) {
    const domain = domainFromUrl(smp.site.url)
    const modelName = smp.modelName
    index.set(`${domain}\t${modelName}`, smp.id)
  }
  return index
}

/**
 * 快速同步：拉 all-channels，更新探针数据 + 价格趋势
 */
async function quickSync() {
  console.log('⚡ 快速同步 all-channels...')
  const start = Date.now()
  const data = await fetchJson('/__all-channels')
  const channels = data.channels || []
  console.log(`拉取 ${channels.length} 条渠道，updatedAt=${data.updatedAt}`)

  const index = await buildProbeIndex()
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

    // 价格趋势增量：只插入比已有更新的记录
    const trend = Array.isArray(c.priceTrend) ? c.priceTrend : []
    if (trend.length > 0) {
      const latest = await prisma.priceHistory.findFirst({
        where: { siteModelPriceId: smpId },
        orderBy: { recordedAt: 'desc' },
      })
      const cutoff = latest?.recordedAt
      const newData = trend
        .filter((t) => !cutoff || (parseDate(t.at) && parseDate(t.at) > cutoff))
        .map((t) => ({
          siteModelPriceId: smpId,
          price: typeof t.priceCny === 'number' ? t.priceCny : 0,
          recordedAt: parseDate(t.at) ?? new Date(),
        }))
        .filter((h) => h.price >= 0)
      if (newData.length > 0) {
        await prisma.priceHistory.createMany({ data: newData })
        newHistory += newData.length
      }
    }
  }

  console.log(`---`)
  console.log(`更新：${updated} / 跳过：${skipped}（all-channels 中无对应渠道）`)
  console.log(`新增价格历史：${newHistory} 条`)
  console.log(`耗时：${((Date.now() - start) / 1000).toFixed(1)}s`)
}

/**
 * 全量同步：拉 providers + 逐站点 detail，增量 upsert 站点和价格
 */
async function fullSync() {
  console.log('🔄 全量同步 providers + site-details...')
  const start = Date.now()

  const providersData = await fetchJson('/__providers')
  const providers = providersData.providers || []
  console.log(`providers: ${providers.length} 个站点`)

  // 拿到现有站点的 domain -> siteId 映射
  const existingSites = await prisma.site.findMany({ select: { id: true, url: true, name: true } })
  const domainToSite = new Map()
  for (const s of existingSites) {
    domainToSite.set(domainFromUrl(s.url), s)
  }

  // 推断 slug：域名去掉非字母数字
  const slugOf = (url) => domainFromUrl(url).replace(/[^a-z0-9]/gi, '')

  let siteUpserted = 0
  let siteSkipped = 0
  let channelUpdated = 0
  let errors = 0

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
      // 新站点，创建
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

    // 拉站点详情
    let detail
    try {
      detail = await fetchJson(`/__site-detail/${encodeURIComponent(slug)}`)
    } catch (e) {
      errors++
      continue
    }
    if (!detail?.ok || !detail?.models) {
      errors++
      continue
    }

    for (const model of detail.models) {
      const modelKey = model.modelKey
      for (const ch of model.channels || []) {
        const baseName = ch.providerModelId || modelKey
        if (!baseName) continue
        const channelName = ch.channelName || 'default'
        const modelName = `${baseName}@${channelName}`

        const fakeRate = ch.fakeRate
        const priceAnomaly =
          (typeof fakeRate === 'number' && fakeRate >= 25) ||
          (typeof ch.passRate === 'number' && ch.passRate < 75)
        const tampered = typeof fakeRate === 'number' && fakeRate >= 25

        await prisma.siteModelPrice.upsert({
          where: { siteId_modelName: { siteId, modelName } },
          create: {
            siteId,
            modelName,
            price: typeof ch.latestInputPriceCny === 'number' ? ch.latestInputPriceCny : 0,
            priceOutput: typeof ch.outputPriceCny === 'number' ? ch.outputPriceCny : null,
            priceCached: typeof ch.cacheInputPriceCny === 'number' ? ch.cacheInputPriceCny : null,
            priceCacheCreate: typeof ch.cacheCreatePriceCny === 'number' ? ch.cacheCreatePriceCny : null,
            passRate: typeof ch.passRate === 'number' ? ch.passRate : null,
            onlineRate: typeof ch.onlineRate === 'number' ? ch.onlineRate : null,
            fakeRateBand: fakeRateToBand(fakeRate),
            avgLatencyMs:
              typeof ch.avgLatencyS === 'number' ? Math.round(ch.avgLatencyS * 1000) : null,
            lastProbedAt: parseDate(ch.lastProbedAt),
            priceAnomaly,
            tampered,
          },
          update: {
            price: typeof ch.latestInputPriceCny === 'number' ? ch.latestInputPriceCny : undefined,
            priceOutput: typeof ch.outputPriceCny === 'number' ? ch.outputPriceCny : undefined,
            priceCached: typeof ch.cacheInputPriceCny === 'number' ? ch.cacheInputPriceCny : undefined,
            priceCacheCreate:
              typeof ch.cacheCreatePriceCny === 'number' ? ch.cacheCreatePriceCny : undefined,
            passRate: typeof ch.passRate === 'number' ? ch.passRate : undefined,
            onlineRate: typeof ch.onlineRate === 'number' ? ch.onlineRate : undefined,
            fakeRateBand: fakeRate != null ? fakeRateToBand(fakeRate) : undefined,
            avgLatencyMs:
              typeof ch.avgLatencyS === 'number' ? Math.round(ch.avgLatencyS * 1000) : undefined,
            lastProbedAt: parseDate(ch.lastProbedAt) ?? undefined,
            priceAnomaly,
            tampered,
          },
        })
        channelUpdated++
      }
    }

    if ((i + 1) % 50 === 0) {
      console.log(`  已处理 ${i + 1}/${providers.length} 站点...`)
    }
    // 限流，避免被封
    await sleep(200)
  }

  console.log(`---`)
  console.log(`站点：新增 ${siteUpserted}，跳过 ${siteSkipped}`)
  console.log(`渠道 upsert：${channelUpdated}`)
  console.log(`错误：${errors}`)
  console.log(`耗时：${((Date.now() - start) / 1000).toFixed(1)}s`)

  // 全量同步后，跑一次快速同步补充 all-channels 探针数据
  console.log('\n→ 追加快速同步 all-channels...')
  await quickSync()
}

const mode = process.argv[2]

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())

async function main() {
  if (mode === '--full') {
    await fullSync()
  } else {
    await quickSync()
  }
}
