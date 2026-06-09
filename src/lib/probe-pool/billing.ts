/**
 * 计费指纹 —— 探测中转站 billing 端点真伪（#15）
 * @see specs/probe-pool/spec.md §5.4
 *
 * 核心信号：fakeOrDisabled（端点伪造或禁用）。
 * multiplier 是辅助启发式（基于总 usage vs 单次估算），非精确值。
 */
import { BillingObservationSchema } from './contract'
import type { BillingObservation } from './contract'

export interface BillingInput {
  baseUrl: string
  apiKey: string
  model?: string
  /** 标称价（CNY / 百万 tokens），来自 SiteModelPrice.price */
  price?: number
}

/** 硬编码人民币→美元汇率（仅供估算，非精确财务用）。spec §5.4 说明此为启发式。 */
const USD_CNY_RATE = 7.2

function normalizeBase(url: string): string {
  return url.replace(/\/+$/, '').replace(/\/v1$/, '')
}

export async function probeBilling(input: BillingInput): Promise<BillingObservation> {
  const base = normalizeBase(input.baseUrl)

  let endpointAvailable = false
  let subscription: { hardLimitUsd: number | null } | null = null
  let usageTotalUsd: number | null = null
  let chargedEstimateUsd: number | null = null
  let multiplier: number | null = null
  let fakeOrDisabled = false

  // 1. 探测 subscription 端点
  try {
    const subRes = await fetch(`${base}/v1/dashboard/billing/subscription`, {
      headers: { Authorization: `Bearer ${input.apiKey}` },
      signal: AbortSignal.timeout(10000),
    })
    if (subRes.ok) {
      const data = await subRes.json()
      // 结构校验：至少要有 hard_limit_usd 或 system_hard_limit_usd
      if (data.hard_limit_usd !== undefined || data.system_hard_limit_usd !== undefined) {
        endpointAvailable = true
        subscription = {
          hardLimitUsd: data.hard_limit_usd ?? data.system_hard_limit_usd ?? null,
        }
      } else {
        fakeOrDisabled = true
      }
    } else {
      fakeOrDisabled = true
    }
  } catch {
    fakeOrDisabled = true
  }

  // 2. 探测 usage 端点
  if (!fakeOrDisabled) {
    try {
      const usageRes = await fetch(`${base}/v1/dashboard/billing/usage`, {
        headers: { Authorization: `Bearer ${input.apiKey}` },
        signal: AbortSignal.timeout(10000),
      })
      if (usageRes.ok) {
        const data = await usageRes.json()
        // OpenAI 格式：total_usage 为 cents；兼容 total_amount
        if (typeof data.total_usage === 'number') {
          usageTotalUsd = data.total_usage / 100
        } else if (typeof data.total_amount === 'number') {
          usageTotalUsd = data.total_amount
        } else {
          fakeOrDisabled = true
        }
      } else {
        fakeOrDisabled = true
      }
    } catch {
      fakeOrDisabled = true
    }
  }

  // 3. max_tokens:1 极小请求，做计费指纹
  if (!fakeOrDisabled && input.price != null && input.price > 0) {
    try {
      const model = input.model ?? 'gpt-3.5-turbo'
      const testRes = await fetch(`${base}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${input.apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: 'hi' }],
          max_tokens: 1,
        }),
        signal: AbortSignal.timeout(10000),
      })
      if (testRes.ok) {
        const data = await testRes.json()
        const promptTokens = data?.usage?.prompt_tokens ?? 0
        const completionTokens = data?.usage?.completion_tokens ?? 0
        const totalTokens = promptTokens + completionTokens
        // 标称价 CNY/百万 token → USD/token（硬编码汇率，仅供参考）
        const usdPerToken = (input.price / 1e6) / USD_CNY_RATE
        chargedEstimateUsd = totalTokens * usdPerToken
        // 注意：usageTotalUsd 是累计值，非单次，multiplier 仅为量级参考
        if (usageTotalUsd != null && chargedEstimateUsd > 0) {
          multiplier = usageTotalUsd / chargedEstimateUsd
        }
      }
    } catch {
      // 测试请求失败不影响 fakeOrDisabled（billing 端点本身存在）
    }
  }

  return BillingObservationSchema.parse({
    endpointAvailable,
    subscription,
    usageTotalUsd,
    chargedEstimateUsd,
    multiplier,
    fakeOrDisabled,
  })
}
