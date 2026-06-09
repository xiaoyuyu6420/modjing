/**
 * 探针池契约 —— 单一权威来源
 * @see specs/probe-pool/spec.md §4（数据结构·契约）
 * @see specs/probe-pool/spec.md §6.6（不静默写脏值：解析失败抛 ZodError，对齐 data-pipeline §6.4）
 */
import { z } from 'zod'

export const ProbeCategorySchema = z.enum([
  'identity',
  'capability',
  'fingerprint',
  'dilution',
  'protocol',
  'billing',
])

export const ProbeTierSchema = z.enum(['keyless', 'lightweight', 'deep'])

export const PoolEntryStatusSchema = z.enum(['live', 'retired', 'public'])

/** 单模型基线：用于轻量比对（深度比对交给 Python 服务） */
export const BaselineModelSchema = z.object({
  cutoffYear: z.number().nullish(),
  expectedTokens: z.number().positive(),
  matchers: z.array(z.string()).nullish(),
})

export const BaselineAnswerSchema = z.object({
  // key = 模型 base 名，如 'claude-opus-4-8'
  models: z.record(z.string(), BaselineModelSchema),
})

export const PoolEntrySchema = z.object({
  id: z.string(),
  category: ProbeCategorySchema,
  tier: ProbeTierSchema,
  prompt: z.string(),
  maxTokens: z.number().int().positive(),
  /** 默认预期 prompt_tokens；被 baseline.models[model].expectedTokens 覆盖 */
  expectedTokens: z.number().positive(),
  baseline: BaselineAnswerSchema.nullish(),
  weight: z.number().min(0).max(1),
  status: PoolEntryStatusSchema,
  // constitution §2.2：llm-verify(MIT) 来源 prompt 须标 'llm-verify-mit' 以保留版权；其余可省略
  source: z.enum(['modjing', 'llm-verify-mit']).optional(),
})

export const ProbePoolSchema = z.object({
  version: z.string(),
  generatedAt: z.string(),
  entries: z.array(PoolEntrySchema),
})

/** 探针明细 */
export const ProbeDetailSchema = z.object({
  check: z.string(),
  tier: ProbeTierSchema,
  category: ProbeCategorySchema,
  poolEntryId: z.string().nullish(),
  passed: z.boolean(),
  message: z.string(),
  observed: z.record(z.string(), z.unknown()).nullish(),
})

export const TierSummarySchema = z.object({
  run: z.number(),
  passed: z.number(),
})

/** 探针运行结果 */
export const ProbeOutputSchema = z.object({
  poolVersion: z.string(),
  score: z.number(),
  verdict: z.enum(['LEGITIMATE', 'SUSPICIOUS', 'FRAUD_DETECTED', 'INCONCLUSIVE']),
  tokenUsageRatio: z.number().nullish(),
  billingMultiplier: z.number().nullish(),
  latencyMs: z.number().nullish(),
  details: z.array(ProbeDetailSchema),
  tiers: z.object({
    keyless: TierSummarySchema,
    lightweight: TierSummarySchema,
    deep: TierSummarySchema,
  }),
})

/** 计费探针观测（#15） */
export const BillingObservationSchema = z.object({
  endpointAvailable: z.boolean(),
  subscription: z.object({ hardLimitUsd: z.number().nullish() }).nullish(),
  usageTotalUsd: z.number().nullish(),
  chargedEstimateUsd: z.number().nullish(),
  multiplier: z.number().nullish(),
  fakeOrDisabled: z.boolean(),
})

export type ProbeCategory = z.infer<typeof ProbeCategorySchema>
export type ProbeTier = z.infer<typeof ProbeTierSchema>
export type PoolEntryStatus = z.infer<typeof PoolEntryStatusSchema>
export type BaselineModel = z.infer<typeof BaselineModelSchema>
export type BaselineAnswer = z.infer<typeof BaselineAnswerSchema>
export type PoolEntry = z.infer<typeof PoolEntrySchema>
export type ProbePool = z.infer<typeof ProbePoolSchema>
export type ProbeDetail = z.infer<typeof ProbeDetailSchema>
export type ProbeOutput = z.infer<typeof ProbeOutputSchema>
export type BillingObservation = z.infer<typeof BillingObservationSchema>
