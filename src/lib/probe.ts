/**
 * 模镜内置轻量探针
 *
 * 直接调用中转站的 OpenAI 兼容 API（/v1/chat/completions），
 * 检查回复真实性，不依赖外部检测服务。
 *
 * 检查维度：
 *  1. 连通性 — HTTP 请求是否成功
 *  2. 知识截止 — 回复的年份是否匹配模型版本（防 GPT-3.5 伪装成 Claude）
 *  3. Token 用量 — usage.prompt_tokens 是否合理（掺水站可能伪造 usage）
 *  4. 延迟 — 首 token 延迟和总耗时
 */

export interface ProbeInput {
  /** 中转站 API 地址，如 https://api.xxx.com（不带 /v1） */
  baseUrl: string
  apiKey: string
  /** 模型名，如 claude-opus-4-8 */
  model: string
}

export interface ProbeDetail {
  check: string
  passed: boolean
  message: string
}

export interface ProbeOutput {
  score: number // 0-100，越高越正常
  verdict: 'LEGITIMATE' | 'SUSPICIOUS' | 'FRAUD_DETECTED' | 'INCONCLUSIVE'
  tokenUsageRatio: number | null
  latencyMs: number | null
  details: ProbeDetail[]
}

/** 已知模型的预期知识截止年份（用于检测伪装） */
const EXPECTED_CUTOFF: Record<string, number> = {
  'claude-opus-4-8': 2025,
  'claude-opus-4-7': 2025,
  'claude-sonnet-4-6': 2025,
  'gpt-5.5': 2025,
  'gpt-5.4': 2024,
  'gemini-3.1-pro': 2025,
}

const PROBE_PROMPT =
  'What is your knowledge cutoff date? Please answer honestly with just the year and month if possible.'

/** 固定探针 prompt 的预期 token 数（约 22 个英文 token） */
const EXPECTED_PROMPT_TOKENS = 22

function normalizeBase(url: string): string {
  return url.replace(/\/+$/, '').replace(/\/v1$/, '')
}

/**
 * 检查回复中的知识截止年份是否合理
 */
function checkCutoffYear(reply: string, model: string): ProbeDetail {
  const years = reply.match(/20\d{2}/g) ?? []
  const maxYear = years.length ? Math.max(...years.map(Number)) : null
  const expected = EXPECTED_CUTOFF[model]

  if (maxYear == null) {
    return {
      check: 'knowledge_cutoff',
      passed: false,
      message: `回复未包含年份，无法判断。回复片段："${reply.slice(0, 60)}"`,
    }
  }

  if (expected && maxYear < expected - 1) {
    return {
      check: 'knowledge_cutoff',
      passed: false,
      message: `声称知识截止 ${maxYear} 年，但 ${model} 应为 ${expected} 年左右，疑似旧模型伪装`,
    }
  }

  return {
    check: 'knowledge_cutoff',
    passed: true,
    message: `知识截止 ${maxYear} 年，符合 ${model} 预期`,
  }
}

/**
 * 检查 usage 字段是否合理
 */
function checkTokenUsage(usage: any): { detail: ProbeDetail; ratio: number | null } {
  if (!usage) {
    return {
      detail: { check: 'token_usage', passed: false, message: '响应缺少 usage 字段' },
      ratio: null,
    }
  }

  const promptTokens = typeof usage.prompt_tokens === 'number' ? usage.prompt_tokens : null
  const completionTokens =
    typeof usage.completion_tokens === 'number' ? usage.completion_tokens : null

  if (promptTokens == null || promptTokens <= 0) {
    return {
      detail: { check: 'token_usage', passed: false, message: `prompt_tokens 异常：${promptTokens}` },
      ratio: null,
    }
  }

  // ratio = 实际 prompt_tokens / 预期。正常应接近 1.0
  const ratio = promptTokens / EXPECTED_PROMPT_TOKENS

  // ratio 在 0.3-3.0 之间算正常（不同 tokenizer 有差异）
  if (ratio < 0.3) {
    return {
      detail: {
        check: 'token_usage',
        passed: false,
        message: `prompt_tokens=${promptTokens} 远低于预期(${EXPECTED_PROMPT_TOKENS})，疑似伪造 usage 掩盖缩水`,
      },
      ratio,
    }
  }

  return {
    detail: {
      check: 'token_usage',
      passed: true,
      message: `prompt=${promptTokens} completion=${completionTokens ?? '-'} (ratio=${ratio.toFixed(2)})`,
    },
    ratio,
  }
}

/**
 * 运行一次探针检测
 */
export async function runProbe(input: ProbeInput): Promise<ProbeOutput> {
  const base = normalizeBase(input.baseUrl)
  const details: ProbeDetail[] = []
  let tokenUsageRatio: number | null = null
  let latencyMs: number | null = null

  // 1. 连通性 + 发送探针请求
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
        messages: [{ role: 'user', content: PROBE_PROMPT }],
        max_tokens: 200,
      }),
      signal: AbortSignal.timeout(30000),
    })
  } catch (e) {
    details.push({
      check: 'connectivity',
      passed: false,
      message: `请求失败：${e instanceof Error ? e.message : '未知错误'}`,
    })
    return scoreProbe(details, tokenUsageRatio, latencyMs)
  }
  latencyMs = Date.now() - start

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    details.push({
      check: 'connectivity',
      passed: false,
      message: `HTTP ${res.status}：${body.slice(0, 100)}`,
    })
    return scoreProbe(details, tokenUsageRatio, latencyMs)
  }
  details.push({
    check: 'connectivity',
    passed: true,
    message: `HTTP 200，耗时 ${latencyMs}ms`,
  })

  // 2. 解析响应
  let data: any
  try {
    data = await res.json()
  } catch {
    details.push({ check: 'response', passed: false, message: '响应不是合法 JSON' })
    return scoreProbe(details, tokenUsageRatio, latencyMs)
  }

  const reply: string = data?.choices?.[0]?.message?.content ?? ''

  // 3. 知识截止检查
  details.push(checkCutoffYear(reply, input.model))

  // 4. Token usage 检查
  const usageCheck = checkTokenUsage(data?.usage)
  details.push(usageCheck.detail)
  tokenUsageRatio = usageCheck.ratio

  // 5. 延迟检查（>30秒算可疑）
  if (latencyMs > 30000) {
    details.push({
      check: 'latency',
      passed: false,
      message: `延迟过高：${latencyMs}ms`,
    })
  } else {
    details.push({
      check: 'latency',
      passed: true,
      message: `延迟正常：${latencyMs}ms`,
    })
  }

  return scoreProbe(details, tokenUsageRatio, latencyMs)
}

/**
 * 根据检查项打分
 */
function scoreProbe(
  details: ProbeDetail[],
  tokenUsageRatio: number | null,
  latencyMs: number | null,
): ProbeOutput {
  const total = details.length || 1
  const passed = details.filter((d) => d.passed).length
  const score = Math.round((passed / total) * 100)

  let verdict: ProbeOutput['verdict']
  if (score >= 80) verdict = 'LEGITIMATE'
  else if (score >= 50) verdict = 'SUSPICIOUS'
  else if (score > 0) verdict = 'FRAUD_DETECTED'
  else verdict = 'INCONCLUSIVE'

  return { score, verdict, tokenUsageRatio, latencyMs, details }
}
