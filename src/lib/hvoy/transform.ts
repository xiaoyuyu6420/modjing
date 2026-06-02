/**
 * hvoy 数据转换函数 —— 单一来源
 *
 * @see specs/data-pipeline/spec.md §5 （转换规则，权威定义）
 *
 * 这些函数从 scripts/import-hvoy.mjs 与 sync-hvoy.mjs 逐字提取，
 * 行为必须与原 inline 实现完全一致（迁移后数据不变）。
 */

/** 掺水分级（spec §5） */
export type FakeRateBand = 'severe' | 'light' | 'low' | 'minimal'

/**
 * fakeRate → 分级 band（spec §5）
 * null→null；≥25→severe；≥15→light；≥5→low；其余→minimal
 */
export function fakeRateToBand(rate: number | null | undefined): FakeRateBand | null {
  if (rate == null) return null
  if (rate >= 25) return 'severe'
  if (rate >= 15) return 'light'
  if (rate >= 5) return 'low'
  return 'minimal'
}

/**
 * 解析日期字符串（spec §5）
 * 空→null；合法→Date；非法→null
 */
export function parseDate(value: string | null | undefined): Date | null {
  if (!value) return null
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? null : d
}

/**
 * 从 URL 提取域名（去 www.）（spec §5）
 * 非法 URL→''
 */
export function domainFromUrl(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return ''
  }
}

/**
 * 拼装渠道模型名（spec §5）
 * `${base}@${channel ?? 'default'}`；channel 空（null/undefined/''）→ 'default'
 *
 * base 由调用方保证非空（site-detail: providerModelId||modelKey；all-channels: modelKey）
 */
export function buildModelName(base: string, channel: string | null | undefined): string {
  return `${base}@${channel || 'default'}`
}

/**
 * 价格异常标记（spec §5）
 * fakeRate≥25 或 passRate<75
 */
export function priceAnomaly(
  fakeRate: number | null | undefined,
  passRate: number | null | undefined,
): boolean {
  return (typeof fakeRate === 'number' && fakeRate >= 25) ||
    (typeof passRate === 'number' && passRate < 75)
}

/**
 * 掺水标记（spec §5）
 * fakeRate≥25
 */
export function tampered(fakeRate: number | null | undefined): boolean {
  return typeof fakeRate === 'number' && fakeRate >= 25
}

/**
 * 秒→毫秒（spec §5）
 * 非法/空→null；否则 Math.round(s * 1000)
 */
export function avgLatencyMs(avgLatencyS: number | null | undefined): number | null {
  return typeof avgLatencyS === 'number' ? Math.round(avgLatencyS * 1000) : null
}
