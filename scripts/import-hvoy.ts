/**
 * hvoy 离线全量导入 —— 从 research/ 快照重建数据库
 *
 * 用法：npm run import-hvoy
 *
 * 与 sync.ts（线上 fetch）不同：本脚本读本地快照文件，用于一次性初始化。
 * 共用 contract（校验快照）+ transform（转换函数），消除重复。
 *
 * @see specs/data-pipeline/spec.md §4/§5
 */
import { PrismaClient } from '@prisma/client'
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import {
  SiteDetailResponseSchema,
  AllChannelsResponseSchema,
  buildModelName,
  parseDate,
  fakeRateToBand,
  priceAnomaly,
  tampered,
  avgLatencyMs,
} from '../src/lib/hvoy'

const prisma = new PrismaClient()

const SNAPSHOT_DIR = join(
  process.cwd(),
  'research/hvoy-intel/api-snapshots/site-details-20260616T041228Z',
)

const ALL_CHANNELS_PATH = join(
  process.cwd(),
  'research/hvoy-intel/api-snapshots/__all-channels.20260616T040444Z.json',
)

async function main() {
  console.log('清空旧数据...')
  await prisma.priceHistory.deleteMany()
  await prisma.healthCheck.deleteMany()
  await prisma.review.deleteMany()
  await prisma.relayNotice.deleteMany()
  await prisma.siteModelPrice.deleteMany()
  await prisma.site.deleteMany()

  const files = readdirSync(SNAPSHOT_DIR).filter((f) => f.endsWith('.json'))
  console.log(`发现 ${files.length} 个 site-detail JSON`)

  // 索引：siteDomain + modelKey@channel / baseModelName@channel -> smp.id
  const probeIndex = new Map<string, number>()

  let siteCount = 0
  let channelCount = 0
  let historyCount = 0
  let skipped = 0

  for (const file of files) {
    const raw = readFileSync(join(SNAPSHOT_DIR, file), 'utf-8')
    const parsed = SiteDetailResponseSchema.safeParse(JSON.parse(raw))
    if (!parsed.success || !parsed.data.ok) {
      skipped++
      continue
    }
    const payload = parsed.data
    const s = payload.site
    const url = s.siteDomain ? `https://${s.siteDomain}` : ''
    if (!s.siteName || !url) {
      skipped++
      continue
    }

    const createdAt = parseDate(s.officialSiteEstablishedAt) ?? new Date()

    const site = await prisma.site.create({
      data: {
        name: s.siteName,
        url,
        description: s.siteDescription ?? null,
        isFree: false,
        status: 'online',
        paymentMethods: '',
        hasInvoice: false,
        createdAt,
      },
    })
    siteCount++

    for (const model of payload.models) {
      for (const ch of model.channels) {
        const base = ch.providerModelId || model.modelKey
        if (!base) continue
        const channelName = ch.channelName
        const modelName = buildModelName(base, channelName)
        const fakeRate = ch.fakeRate

        let smp
        try {
          smp = await prisma.siteModelPrice.create({
            data: {
              siteId: site.id,
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
          })
          channelCount++
        } catch {
          // 极少数同站点重名 channel，跳过
          continue
        }

        // 建立索引：modelKey 和 base 两个 key 都记录，提高 all-channels 匹配率
        probeIndex.set(`${s.siteDomain}\t${buildModelName(model.modelKey, channelName)}`, smp.id)
        probeIndex.set(`${s.siteDomain}\t${modelName}`, smp.id)

        const trend = ch.priceTrend ?? []
        if (trend.length > 0) {
          const historyData = trend
            .map((t) => ({
              siteModelPriceId: smp.id,
              price: typeof t.priceCny === 'number' ? t.priceCny : 0,
              recordedAt: parseDate(t.at) ?? new Date(),
            }))
            .filter((h) => h.price >= 0)
          if (historyData.length > 0) {
            await prisma.priceHistory.createMany({ data: historyData })
            historyCount += historyData.length
          }
        }
      }
    }

    if (siteCount % 50 === 0) {
      console.log(`已导入 ${siteCount} 站 / ${channelCount} channel ...`)
    }
  }

  console.log('---')
  console.log(`站点：${siteCount}`)
  console.log(`Channel (SiteModelPrice)：${channelCount}`)
  console.log(`PriceHistory：${historyCount}`)
  console.log(`跳过：${skipped}`)

  // === 合并 all-channels：补充 hvoy 跑过探针的精选渠道数据 ===
  if (existsSync(ALL_CHANNELS_PATH)) {
    console.log('\n合并 all-channels 探针数据...')
    const acParsed = AllChannelsResponseSchema.parse(JSON.parse(readFileSync(ALL_CHANNELS_PATH, 'utf-8')))
    let merged = 0
    let acSkipped = 0

    for (const c of acParsed.channels) {
      const key = `${c.siteDomain}\t${buildModelName(c.modelKey, c.channel)}`
      const smpId = probeIndex.get(key)
      if (!smpId) {
        acSkipped++
        continue
      }

      await prisma.siteModelPrice.update({
        where: { id: smpId },
        data: {
          // all-channels 是 hvoy 实跑探针的数据，优先用它
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
      merged++
    }

    console.log(`all-channels 合并：${merged}/${acParsed.channels.length}（跳过 ${acSkipped}）`)
  } else {
    console.warn('未找到 all-channels 快照，跳过探针合并')
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
