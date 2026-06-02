/**
 * 转换函数 + schema 护栏测试
 *
 * @see specs/data-pipeline/spec.md §5 （转换规则）
 * @see specs/data-pipeline/spec.md §7 （成功标准：类型错必拒绝 = 护栏核心）
 */
import { describe, it, expect } from 'vitest'
import {
  fakeRateToBand,
  parseDate,
  domainFromUrl,
  buildModelName,
  priceAnomaly,
  tampered,
  avgLatencyMs,
  AllChannelsResponseSchema,
} from './index'

// ── fakeRateToBand（spec §5）──
describe('fakeRateToBand', () => {
  it('null/undefined → null', () => {
    expect(fakeRateToBand(null)).toBeNull()
    expect(fakeRateToBand(undefined)).toBeNull()
  })
  it('≥25 → severe（边界 25 含）', () => {
    expect(fakeRateToBand(25)).toBe('severe')
    expect(fakeRateToBand(50)).toBe('severe')
  })
  it('≥15 → light（边界 15 含）', () => {
    expect(fakeRateToBand(15)).toBe('light')
    expect(fakeRateToBand(24.9)).toBe('light')
  })
  it('≥5 → low（边界 5 含）', () => {
    expect(fakeRateToBand(5)).toBe('low')
    expect(fakeRateToBand(14.9)).toBe('low')
  })
  it('<5 → minimal', () => {
    expect(fakeRateToBand(4.9)).toBe('minimal')
    expect(fakeRateToBand(0)).toBe('minimal')
  })
})

// ── parseDate（spec §5）──
describe('parseDate', () => {
  it('合法 ISO → Date', () => {
    const d = parseDate('2026-06-16T11:45:14.428+08:00')
    expect(d).toBeInstanceOf(Date)
    expect(d!.getFullYear()).toBe(2026)
  })
  it('空 → null', () => {
    expect(parseDate(null)).toBeNull()
    expect(parseDate(undefined)).toBeNull()
    expect(parseDate('')).toBeNull()
  })
  it('非法 → null', () => {
    expect(parseDate('not-a-date')).toBeNull()
  })
})

// ── domainFromUrl（spec §5）──
describe('domainFromUrl', () => {
  it('正常 URL → hostname', () => {
    expect(domainFromUrl('https://lingsuan.top/register')).toBe('lingsuan.top')
  })
  it('去 www.', () => {
    expect(domainFromUrl('https://www.example.com/')).toBe('example.com')
  })
  it('非法 → 空串', () => {
    expect(domainFromUrl('not-a-url')).toBe('')
  })
})

// ── buildModelName（spec §5）──
describe('buildModelName', () => {
  it('正常拼接', () => {
    expect(buildModelName('gpt-5.5', 'cx-pro')).toBe('gpt-5.5@cx-pro')
  })
  it('channel null/undefined/空串 → default', () => {
    expect(buildModelName('claude-opus-4-8', null)).toBe('claude-opus-4-8@default')
    expect(buildModelName('claude-opus-4-8', undefined)).toBe('claude-opus-4-8@default')
    expect(buildModelName('claude-opus-4-8', '')).toBe('claude-opus-4-8@default')
  })
})

// ── priceAnomaly（spec §5）──
describe('priceAnomaly', () => {
  it('fakeRate≥25 → true', () => expect(priceAnomaly(30, 100)).toBe(true))
  it('passRate<75 → true', () => expect(priceAnomaly(0, 70)).toBe(true))
  it('都正常 → false', () => expect(priceAnomaly(10, 90)).toBe(false))
  it('都空 → false', () => expect(priceAnomaly(null, undefined)).toBe(false))
})

// ── tampered（spec §5）──
describe('tampered', () => {
  it('fakeRate≥25 → true', () => {
    expect(tampered(25)).toBe(true)
    expect(tampered(40)).toBe(true)
  })
  it('fakeRate<25 → false', () => expect(tampered(24)).toBe(false))
  it('null → false', () => expect(tampered(null)).toBe(false))
})

// ── avgLatencyMs（spec §5）──
describe('avgLatencyMs', () => {
  it('秒→毫秒 round', () => {
    expect(avgLatencyMs(7.3)).toBe(7300)
    expect(avgLatencyMs(0.999)).toBe(999)
  })
  it('null → null', () => {
    expect(avgLatencyMs(null)).toBeNull()
    expect(avgLatencyMs(undefined)).toBeNull()
  })
})

// ── 护栏核心：schema 校验（spec §6 不变量 4 + §7 成功标准）──
describe('AllChannelsResponseSchema（护栏：类型错必拒绝）', () => {
  // 真实样本：research 快照里 lingsuan.top 的渠道
  const validChannel = {
    siteDomain: 'lingsuan.top',
    site: '灵算',
    channel: 'cx-pro',
    modelKey: 'gpt-5.5',
    passRate: 100,
    onlineRate: 97.9,
    avgLatencyS: 7.3,
    latestInputPriceCny: 1.2,
    priceTrend: [{ at: '2026-06-16T11:45:14.428+08:00', priceCny: 1.2 }],
    tokenUsageRatio: 0.9494,
    sampleCount: 47,
    weightedScore: 84.2,
    verificationType: 'enterprise',
    recentOnlineSeq: '111111111111111111111111',
  }
  const validPayload = {
    updatedAt: '2026-06-16T08:58:56.585+08:00',
    channels: [validChannel],
  }

  it('合法 payload 通过', () => {
    expect(AllChannelsResponseSchema.safeParse(validPayload).success).toBe(true)
  })

  it('核心字段缺失 → 拒绝（siteDomain 必填）', () => {
    const bad = { ...validPayload, channels: [{ ...validChannel, siteDomain: undefined }] }
    expect(AllChannelsResponseSchema.safeParse(bad).success).toBe(false)
  })

  it('字段类型错 → 拒绝（passRate 变 string）— spec §7 护栏核心', () => {
    const bad = { ...validPayload, channels: [{ ...validChannel, passRate: '100' }] }
    expect(AllChannelsResponseSchema.safeParse(bad).success).toBe(false)
  })

  it('数值字段缺失 → 通过（.nullish 容忍缺失，只拒类型错）', () => {
    const minimal = { channels: [{ siteDomain: 'x.com', modelKey: 'm' }] }
    expect(AllChannelsResponseSchema.safeParse(minimal).success).toBe(true)
  })
})
