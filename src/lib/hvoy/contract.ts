/**
 * hvoy API 响应 schema —— 单一权威契约来源
 *
 * @see specs/data-pipeline/spec.md §4 （字段定义）
 * @see specs/data-pipeline/spec.md §6 不变量 4（校验失败抛错，不静默 null）
 *
 * 设计原则：
 * - 核心标识字段（siteDomain / modelKey / siteName）必填，缺失即抛错
 * - 度量数值字段 .nullish()：容忍缺失，但类型错（如 number 变 string）必抛
 *   → 让"hvoy 改字段类型"在测试里红（spec §7 成功标准）
 */
import { z } from 'zod'

// ── 公共：价格趋势点（spec §4，all-channels 与 site-detail 共用）──
export const PricePointSchema = z.object({
  at: z.string(),
  priceCny: z.number(),
})

// ── GET /__all-channels（spec §4）──
export const AllChannelsChannelSchema = z.object({
  relaySiteId: z.number().nullish(),
  siteDomain: z.string(), // 核心标识，必填
  site: z.string().nullish(),
  channel: z.string().nullish(),
  siteUrl: z.string().nullish(),
  modelKey: z.string(), // 核心标识，必填
  lastResult: z.string().nullish(),
  recentOnlineSeq: z.string().nullish(),
  passRate: z.number().nullish(),
  onlineRate: z.number().nullish(),
  failRate: z.number().nullish(),
  avgLatencyS: z.number().nullish(),
  latencySuspicious: z.boolean().nullish(),
  latestInputPriceCny: z.number().nullish(),
  priceTrend: z.array(PricePointSchema).nullish(),
  tokenUsageRatio: z.number().nullish(),
  sampleCount: z.number().nullish(),
  weightedScore: z.number().nullish(),
  defaultRanking: z.number().nullish(),
  verificationType: z.string().nullish(),
})

export const AllChannelsResponseSchema = z.object({
  updatedAt: z.string().nullish(),
  channels: z.array(AllChannelsChannelSchema),
  modelDisplayConfigs: z.unknown().nullish(),
})

// ── GET /__providers（spec §4）──
export const ProviderSchema = z.object({
  name: z.string(),
  url: z.string(),
})

export const ProvidersResponseSchema = z.object({
  providers: z.array(ProviderSchema),
})

// ── GET /__site-detail/{slug}（spec §4）──
export const SiteDetailSiteSchema = z.object({
  siteDomain: z.string(),
  siteName: z.string(),
  siteDescription: z.string().nullish(),
  officialSiteEstablishedAt: z.string().nullish(),
})

export const SiteDetailChannelSchema = z.object({
  providerModelId: z.string().nullish(),
  channelName: z.string().nullish(),
  latestInputPriceCny: z.number().nullish(),
  outputPriceCny: z.number().nullish(),
  cacheInputPriceCny: z.number().nullish(),
  cacheCreatePriceCny: z.number().nullish(),
  passRate: z.number().nullish(),
  onlineRate: z.number().nullish(),
  fakeRate: z.number().nullish(),
  avgLatencyS: z.number().nullish(),
  lastProbedAt: z.string().nullish(),
  priceTrend: z.array(PricePointSchema).nullish(),
})

export const SiteDetailModelSchema = z.object({
  modelKey: z.string(),
  channels: z.array(SiteDetailChannelSchema),
})

export const SiteDetailResponseSchema = z.object({
  ok: z.boolean(),
  site: SiteDetailSiteSchema,
  models: z.array(SiteDetailModelSchema),
})

// ── 导出推断类型 ──
export type PricePoint = z.infer<typeof PricePointSchema>
export type AllChannelsChannel = z.infer<typeof AllChannelsChannelSchema>
export type AllChannelsResponse = z.infer<typeof AllChannelsResponseSchema>
export type ProvidersResponse = z.infer<typeof ProvidersResponseSchema>
export type SiteDetailSite = z.infer<typeof SiteDetailSiteSchema>
export type SiteDetailChannel = z.infer<typeof SiteDetailChannelSchema>
export type SiteDetailModel = z.infer<typeof SiteDetailModelSchema>
export type SiteDetailResponse = z.infer<typeof SiteDetailResponseSchema>
