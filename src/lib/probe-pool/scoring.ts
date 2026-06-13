/**
 * 探针计分 —— 纯函数，单一来源
 * @see specs/probe-pool/spec.md §5.5（计分）
 * @see specs/probe-pool/spec.md §5.3（掺水 ratio 阈值按 category）
 */
import type { ProbeCategory, ProbeDetail, ProbeOutput } from './contract'

/** 各 category 的掺水 ratio 下限（低于即判掺水）。身份类更严，能力/指纹类宽松。 */
export const DILUTION_RATIO_THRESHOLD: Record<ProbeCategory, number> = {
  identity: 0.5,
  capability: 0.3,
  fingerprint: 0.3,
  dilution: 0.3,
  protocol: 0, // 不用 ratio
  billing: 0, // 不用 ratio
}

/** 计费倍率超过此值 → 主分扣分（spec §5.5） */
export const BILLING_MULTIPLIER_PENALTY_THRESHOLD = 1.5
export const BILLING_MULTIPLIER_PENALTY = 15

/** 0-100 → 4 档 verdict（沿用 probe.ts 原逻辑） */
export function verdictFromScore(score: number): ProbeOutput['verdict'] {
  if (score >= 80) return 'LEGITIMATE'
  if (score >= 50) return 'SUSPICIOUS'
  if (score > 0) return 'FRAUD_DETECTED'
  return 'INCONCLUSIVE'
}

/** 按层汇总 details → tiers（spec §4.2） */
export function summarizeTiers(details: ProbeDetail[]): ProbeOutput['tiers'] {
  const sum = (tier: ProbeDetail['tier']) => {
    const items = details.filter((d) => d.tier === tier)
    return { run: items.length, passed: items.filter((d) => d.passed).length }
  }
  return {
    keyless: sum('keyless'),
    lightweight: sum('lightweight'),
    deep: sum('deep'),
  }
}

/**
 * 主分 = lightweight 层通过率（keyless/deep 不进主分，spec §5.1/§5.5）
 * 返回 0-100。
 */
export function computeMainScore(details: ProbeDetail[]): number {
  const items = details.filter((d) => d.tier === 'lightweight')
  const total = items.length || 1
  const passed = items.filter((d) => d.passed).length
  return Math.round((passed / total) * 100)
}

import type { BillingObservation } from './contract'

/**
 * 应用计费修饰（spec §5.5）
 * - fakeOrDisabled → verdict 不高于 SUSPICIOUS
 * - multiplier > 1.5 → 主分扣 15
 */
export function applyBillingPenalty(
  score: number,
  verdict: ProbeOutput['verdict'],
  billing: BillingObservation | null,
): { score: number; verdict: ProbeOutput['verdict'] } {
  if (!billing) return { score, verdict }
  let newScore = score
  let newVerdict = verdict

  if (billing.fakeOrDisabled && newVerdict === 'LEGITIMATE') {
    newVerdict = 'SUSPICIOUS'
  }
  if (billing.multiplier != null && billing.multiplier > BILLING_MULTIPLIER_PENALTY_THRESHOLD) {
    newScore = Math.max(0, newScore - BILLING_MULTIPLIER_PENALTY)
    newVerdict = verdictFromScore(newScore)
  }

  return { score: newScore, verdict: newVerdict }
}
