/**
 * 探针编排 —— 单条 / 多 prompt 探测，返回 ProbeOutput
 *
 * @see specs/probe-pool/spec.md §5
 * @see specs/probe-pool/spec.md §1（脆弱点 1：假探针 → 真探针池）
 */
import { loadLivePool, getCurrentVersion } from './pool'
import { samplePool } from './sample'
import {
  verdictFromScore,
  summarizeTiers,
  computeMainScore,
  DILUTION_RATIO_THRESHOLD,
} from './scoring'
import type { PoolEntry, ProbeDetail, ProbeOutput } from './contract'

/** runProbe 的输入（与 probe.ts 兼容） */
export interface ProbeInput {
  baseUrl: string
  apiKey: string
  model: string
}

function normalizeBase(url: string): string {
  return url.replace(/\/+$/, '').replace(/\/v1$/, '')
}

function checkCutoffYear(entry: PoolEntry, reply: string, model: string): ProbeDetail | null {
  const baseline = entry.baseline?.models[model]
  if (!baseline?.cutoffYear) return null

  const years = reply.match(/20\d{2}/g) ?? []
  const maxYear = years.length ? Math.max(...years.map(Number)) : null
  const expected = baseline.cutoffYear

  if (maxYear == null) {
    return {
      check: 'knowledge_cutoff',
      tier: 'lightweight',
      category: 'identity',
      poolEntryId: entry.id,
      passed: false,
      message: `回复未包含年份，无法判断。回复片段："${reply.slice(0, 60)}"`,
      observed: null,
    }
  }

  if (maxYear < expected - 1) {
    return {
      check: 'knowledge_cutoff',
      tier: 'lightweight',
      category: 'identity',
      poolEntryId: entry.id,
      passed: false,
      message: `声称知识截止 ${maxYear} 年，但 ${model} 应为 ${expected} 年左右，疑似旧模型伪装`,
      observed: { maxYear, expected },
    }
  }

  return {
    check: 'knowledge_cutoff',
    tier: 'lightweight',
    category: 'identity',
    poolEntryId: entry.id,
    passed: true,
    message: `知识截止 ${maxYear} 年，符合 ${model} 预期`,
    observed: { maxYear },
  }
}

function checkTokenUsage(
  entry: PoolEntry,
  usage: any,
  model: string,
): { detail: ProbeDetail; ratio: number | null } {
  const modelBaseline = entry.baseline?.models[model]
  const expectedTokens = modelBaseline?.expectedTokens ?? entry.expectedTokens
  const threshold = DILUTION_RATIO_THRESHOLD[entry.category]

  if (!usage) {
    return {
      detail: {
        check: 'token_usage',
        tier: 'lightweight',
        category: entry.category,
        poolEntryId: entry.id,
        passed: false,
        message: '响应缺少 usage 字段',
        observed: null,
      },
      ratio: null,
    }
  }

  const promptTokens = typeof usage.prompt_tokens === 'number' ? usage.prompt_tokens : null
  const completionTokens = typeof usage.completion_tokens === 'number' ? usage.completion_tokens : null

  if (promptTokens == null || promptTokens <= 0) {
    return {
      detail: {
        check: 'token_usage',
        tier: 'lightweight',
        category: entry.category,
        poolEntryId: entry.id,
        passed: false,
        message: `prompt_tokens 异常：${promptTokens}`,
        observed: null,
      },
      ratio: null,
    }
  }

  const ratio = promptTokens / expectedTokens

  if (ratio < threshold) {
    return {
      detail: {
        check: 'token_usage',
        tier: 'lightweight',
        category: entry.category,
        poolEntryId: entry.id,
        passed: false,
        message: `prompt_tokens=${promptTokens} 远低于预期(${expectedTokens})，疑似伪造 usage 掩盖缩水`,
        observed: { ratio, expectedTokens, promptTokens },
      },
      ratio,
    }
  }

  return {
    detail: {
      check: 'token_usage',
      tier: 'lightweight',
      category: entry.category,
      poolEntryId: entry.id,
      passed: true,
      message: `prompt=${promptTokens} completion=${completionTokens ?? '-'} (ratio=${ratio.toFixed(2)})`,
      observed: { ratio, expectedTokens, promptTokens },
    },
    ratio,
  }
}

/**
 * 发送单条探针请求（对应 probe.ts 原单条逻辑）
 * 从 PoolEntry 取值（prompt、maxTokens、expectedTokens、baseline），
 * 替代全局硬编码常数。
 */
async function sendSingleProbe(
  entry: PoolEntry,
  input: ProbeInput,
): Promise<{
  details: ProbeDetail[]
  tokenUsageRatio: number | null
  latencyMs: number | null
}> {
  const base = normalizeBase(input.baseUrl)
  const details: ProbeDetail[] = []
  let tokenUsageRatio: number | null = null
  let latencyMs: number | null = null

  // 1. 连通性
  const start = Date.now()
  let res: Response
  try {
    res = await fetch(`${base}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${input.apiKey}`,
      },
      body: JSON.stringify({
        model: input.model,
        messages: [{ role: 'user', content: entry.prompt }],
        max_tokens: entry.maxTokens,
      }),
      signal: AbortSignal.timeout(30000),
    })
  } catch (e) {
    details.push({
      check: 'connectivity',
      tier: 'lightweight',
      category: entry.category,
      poolEntryId: entry.id,
      passed: false,
      message: `请求失败：${e instanceof Error ? e.message : '未知错误'}`,
      observed: null,
    })
    return { details, tokenUsageRatio, latencyMs }
  }
  latencyMs = Date.now() - start

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    details.push({
      check: 'connectivity',
      tier: 'lightweight',
      category: entry.category,
      poolEntryId: entry.id,
      passed: false,
      message: `HTTP ${res.status}：${body.slice(0, 100)}`,
      observed: null,
    })
    return { details, tokenUsageRatio, latencyMs }
  }
  details.push({
    check: 'connectivity',
    tier: 'lightweight',
    category: entry.category,
    poolEntryId: entry.id,
    passed: true,
    message: `HTTP 200，耗时 ${latencyMs}ms`,
    observed: null,
  })

  // 2. 解析响应
  let data: any
  try {
    data = await res.json()
  } catch {
    details.push({
      check: 'response',
      tier: 'lightweight',
      category: entry.category,
      poolEntryId: entry.id,
      passed: false,
      message: '响应不是合法 JSON',
      observed: null,
    })
    return { details, tokenUsageRatio, latencyMs }
  }
  const reply: string = data?.choices?.[0]?.message?.content ?? ''

  // 3. 知识截止（仅限含基线的条目）
  const cutoff = checkCutoffYear(entry, reply, input.model)
  if (cutoff) details.push(cutoff)

  // 4. Token usage
  const usageResult = checkTokenUsage(entry, data?.usage, input.model)
  details.push(usageResult.detail)
  tokenUsageRatio = usageResult.ratio

  // 5. 延迟
  if (latencyMs > 30000) {
    details.push({
      check: 'latency',
      tier: 'lightweight',
      category: entry.category,
      poolEntryId: entry.id,
      passed: false,
      message: `延迟过高：${latencyMs}ms`,
      observed: null,
    })
  } else {
    details.push({
      check: 'latency',
      tier: 'lightweight',
      category: entry.category,
      poolEntryId: entry.id,
      passed: true,
      message: `延迟正常：${latencyMs}ms`,
      observed: null,
    })
  }

  return { details, tokenUsageRatio, latencyMs }
}

/**
 * 多 prompt 轻量探针（#14 的 lightweight 层）
 * 从 live 池按配比抽样，逐条发，聚合结果。
 */
export async function runLightweightProbe(
  input: ProbeInput,
  opts: {
    categories?: Partial<Record<'identity' | 'capability' | 'fingerprint' | 'dilution' | 'protocol' | 'billing', number>>
    count?: number
  } = {},
): Promise<ProbeOutput> {
  const pool = loadLivePool()
  const entries = samplePool(pool, {
    tier: 'lightweight',
    categories: opts.categories,
    count: opts.count ?? 4,
    seed: `${input.model}@${normalizeBase(input.baseUrl)}`,
  })

  const allDetails: ProbeDetail[] = []
  let tokenUsageRatio: number | null = null
  let latencyMs: number | null = null
  let lastRatio: number | null = null

  for (const entry of entries) {
    const result = await sendSingleProbe(entry, input)
    allDetails.push(...result.details)
    if (result.tokenUsageRatio != null) lastRatio = result.tokenUsageRatio
    if (result.latencyMs != null) latencyMs = result.latencyMs
  }

  // 取最后一个非空 ratio（后续可改为加权平均）
  tokenUsageRatio = lastRatio

  const score = computeMainScore(allDetails)
  const verdict = verdictFromScore(score)
  const tiers = summarizeTiers(allDetails)

  return {
    poolVersion: pool.version,
    score,
    verdict,
    tokenUsageRatio,
    latencyMs,
    details: allDetails,
    tiers: {
      ...tiers,
      deep: { run: 0, passed: 0 },
    },
  }
}

/**
 * 单 prompt 探针（与原有 probe.ts 的 runProbe 行为一致，向后兼容）。
 * 始终用 live 池的 identity-cutoff 条目，保证 probe.test.ts 稳定。
 */
export async function runProbe(input: ProbeInput): Promise<ProbeOutput> {
  const pool = loadLivePool()
  const cutoffEntry = pool.entries.find((e) => e.id === 'identity-cutoff')
  if (!cutoffEntry) {
    throw new Error('live 池缺少 identity-cutoff 条目')
  }

  const result = await sendSingleProbe(cutoffEntry, input)
  const score = computeMainScore(result.details)
  const verdict = verdictFromScore(score)

  return {
    poolVersion: pool.version,
    score,
    verdict,
    tokenUsageRatio: result.tokenUsageRatio,
    latencyMs: result.latencyMs,
    details: result.details,
    tiers: {
      keyless: { run: 0, passed: 0 },
      lightweight: { run: result.details.length, passed: result.details.filter((d) => d.passed).length },
      deep: { run: 0, passed: 0 },
    },
  }
}
