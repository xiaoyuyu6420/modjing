/**
 * 冒烟测试：真实快照 → schema 校验 → 转换，端到端验证数据管线
 *
 * @see specs/data-pipeline/spec.md §3 （范围：冒烟测试）
 * @see specs/data-pipeline/spec.md §7 （成功标准）
 *
 * fixture 来自 research/hvoy-intel/api-snapshots/ 的真实 hvoy 响应（裁剪版）。
 * 不连真实 DB、不连真实 hvoy —— 纯函数链路验证。
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  AllChannelsResponseSchema,
  SiteDetailResponseSchema,
  buildModelName,
  fakeRateToBand,
  parseDate,
  domainFromUrl,
  priceAnomaly,
  tampered,
  avgLatencyMs,
  type FakeRateBand,
} from './index'

const HERE = dirname(fileURLToPath(import.meta.url))
const FIXTURES = join(HERE, '__fixtures__')

function loadJson(name: string): unknown {
  return JSON.parse(readFileSync(join(FIXTURES, name), 'utf-8'))
}

// ── schema 能吃下真实快照（spec §7）──
describe('冒烟：真实快照通过 schema 校验', () => {
  it('all-channels 快照 → AllChannelsResponseSchema', () => {
    expect(AllChannelsResponseSchema.safeParse(loadJson('all-channels.sample.json')).success).toBe(true)
  })
  it('site-detail 快照 → SiteDetailResponseSchema', () => {
    expect(SiteDetailResponseSchema.safeParse(loadJson('site-detail.sample.json')).success).toBe(true)
  })
})

// ── 转换出合法 prisma 写入结构（对照 scripts/import-hvoy.mjs 现有逻辑）──
describe('冒烟：转换出合法 prisma 写入结构', () => {
  it('all-channels channel → SiteModelPrice 更新字段（quickSync 路径）', () => {
    const parsed = AllChannelsResponseSchema.parse(loadJson('all-channels.sample.json'))
    const c = parsed.channels[0]
    const row = {
      passRate: c.passRate ?? null,
      onlineRate: c.onlineRate ?? null,
      avgLatencyMs: avgLatencyMs(c.avgLatencyS),
      tokenUsageRatio: c.tokenUsageRatio ?? null,
      sampleCount: c.sampleCount ?? null,
      weightedScore: c.weightedScore ?? null,
    }
    // 类型断言：数值字段要么 number 要么 null（符合 prisma Float?）
    expect(row.passRate === null || typeof row.passRate === 'number').toBe(true)
    expect(row.onlineRate === null || typeof row.onlineRate === 'number').toBe(true)
    expect(row.avgLatencyMs === null || typeof row.avgLatencyMs === 'number').toBe(true)
    expect(row.tokenUsageRatio === null || typeof row.tokenUsageRatio === 'number').toBe(true)
    expect(row.sampleCount === null || typeof row.sampleCount === 'number').toBe(true)
    expect(row.weightedScore === null || typeof row.weightedScore === 'number').toBe(true)
  })

  it('site-detail channel → SiteModelPrice 创建结构（import 路径）', () => {
    const parsed = SiteDetailResponseSchema.parse(loadJson('site-detail.sample.json'))
    const model = parsed.models[0]
    const ch = model.channels[0]
    const base = ch.providerModelId || model.modelKey

    const row = {
      modelName: buildModelName(base, ch.channelName),
      price: ch.latestInputPriceCny ?? 0,
      priceOutput: ch.outputPriceCny ?? null,
      priceCached: ch.cacheInputPriceCny ?? null,
      priceCacheCreate: ch.cacheCreatePriceCny ?? null,
      passRate: ch.passRate ?? null,
      onlineRate: ch.onlineRate ?? null,
      fakeRateBand: fakeRateToBand(ch.fakeRate),
      avgLatencyMs: avgLatencyMs(ch.avgLatencyS),
      lastProbedAt: parseDate(ch.lastProbedAt),
      priceAnomaly: priceAnomaly(ch.fakeRate, ch.passRate),
      tampered: tampered(ch.fakeRate),
    }
    // 结构断言（对照 prisma/schema.prisma SiteModelPrice）
    expect(row.modelName).toMatch(/.+@.+/) // base@channel
    expect(typeof row.price).toBe('number')
    expect(['severe', 'light', 'low', 'minimal', null] as (FakeRateBand | null)[]).toContain(row.fakeRateBand)
    expect(row.lastProbedAt === null || row.lastProbedAt instanceof Date).toBe(true)
    expect(typeof row.priceAnomaly).toBe('boolean')
    expect(typeof row.tampered).toBe('boolean')
  })

  it('site-detail site → URL/域名转换', () => {
    const parsed = SiteDetailResponseSchema.parse(loadJson('site-detail.sample.json'))
    const s = parsed.site
    const url = s.siteDomain ? `https://${s.siteDomain}` : ''
    expect(domainFromUrl(url)).toBe(s.siteDomain)
  })

  it('priceTrend → PriceHistory 写入结构', () => {
    const parsed = SiteDetailResponseSchema.parse(loadJson('site-detail.sample.json'))
    const ch = parsed.models[0].channels[0]
    const trend = ch.priceTrend ?? []
    const rows = trend
      .filter((t) => typeof t.priceCny === 'number' && t.priceCny >= 0)
      .map((t) => ({ price: t.priceCny, recordedAt: parseDate(t.at) ?? new Date() }))
    expect(Array.isArray(rows)).toBe(true)
    for (const r of rows) {
      expect(typeof r.price).toBe('number')
      expect(r.recordedAt).toBeInstanceOf(Date)
    }
  })
})
