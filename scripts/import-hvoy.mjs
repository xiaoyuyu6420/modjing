import { PrismaClient } from '@prisma/client'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const prisma = new PrismaClient()

const SNAPSHOT_DIR = join(
  process.cwd(),
  'research/hvoy-intel/api-snapshots/site-details-20260616T041228Z',
)

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

  let siteCount = 0
  let channelCount = 0
  let historyCount = 0
  let skipped = 0

  for (const file of files) {
    const raw = readFileSync(join(SNAPSHOT_DIR, file), 'utf-8')
    let payload
    try {
      payload = JSON.parse(raw)
    } catch (e) {
      console.warn(`跳过解析失败：${file}`)
      skipped++
      continue
    }
    if (!payload?.ok || !payload?.site) {
      skipped++
      continue
    }

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

    const models = Array.isArray(payload.models) ? payload.models : []
    for (const model of models) {
      const channels = Array.isArray(model.channels) ? model.channels : []
      for (const ch of channels) {
        const baseModelName = ch.providerModelId || model.modelKey
        if (!baseModelName) continue
        const channelName = ch.channelName || 'default'
        const modelName = `${baseModelName}@${channelName}`

        const price = typeof ch.latestInputPriceCny === 'number' ? ch.latestInputPriceCny : 0
        const fakeRate = ch.fakeRate
        const passRate = ch.passRate
        const onlineRate = ch.onlineRate
        const avgLatencyMs =
          typeof ch.avgLatencyS === 'number' ? Math.round(ch.avgLatencyS * 1000) : null

        const priceAnomaly =
          (typeof fakeRate === 'number' && fakeRate >= 25) ||
          (typeof passRate === 'number' && passRate < 75)
        const tampered = typeof fakeRate === 'number' && fakeRate >= 25

        let smp
        try {
          smp = await prisma.siteModelPrice.create({
            data: {
              siteId: site.id,
              modelName,
              price,
              passRate: typeof passRate === 'number' ? passRate : null,
              onlineRate: typeof onlineRate === 'number' ? onlineRate : null,
              fakeRateBand: fakeRateToBand(fakeRate),
              avgLatencyMs,
              lastProbedAt: parseDate(ch.lastProbedAt),
              priceAnomaly,
              tampered,
            },
          })
          channelCount++
        } catch (e) {
          // 极少数同站点重名 channel，跳过
          continue
        }

        const trend = Array.isArray(ch.priceTrend) ? ch.priceTrend : []
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
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
