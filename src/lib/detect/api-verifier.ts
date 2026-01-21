// APIVerifier 服务调用（Claude 专用快速检测）

import type {
  DetectResult,
  DetectRequest,
  ApiVerifierRequest,
  ApiVerifierResponse,
  DetectServiceConfig,
} from './types'

const DEFAULT_API_VERIFIER_URL = 'http://localhost:8001'

/**
 * 调用 APIVerifier 进行快速检测
 * 专为 Claude 模型设计，单次请求即可判断
 */
export async function callApiVerifier(
  request: DetectRequest,
  config?: DetectServiceConfig
): Promise<DetectResult> {
  const baseUrl = config?.apiVerifierUrl || DEFAULT_API_VERIFIER_URL
  const timeout = config?.timeout ?? 120

  const requestBody: ApiVerifierRequest = {
    url: request.url,
    api_key: request.apiKey,
    model: request.model,
    message: request.message || '你的知识库截止时间是什么时候? 请一定要诚实回答',
    with_thinking: true,
    with_system: true,
    timeout,
  }

  try {
    const response = await fetch(`${baseUrl}/api/v1/verify/claude`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(timeout * 1000),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`APIVerifier 请求失败: ${response.status} ${errorText}`)
    }

    const data: ApiVerifierResponse = await response.json()

    return {
      score: data.score,
      level: data.level as DetectResult['level'],
      verdict: data.verdict as DetectResult['verdict'],
      details: (data.notes ?? []).join('\n'),
      source: 'api-verifier',
      breakdown: {
        knowledge_score: data.breakdown.knowledge_score,
        sse_score: data.breakdown.sse_score,
        thinking_score: data.breakdown.thinking_score,
        usage_score: data.breakdown.usage_score,
        penalty_score: data.breakdown.penalty_score,
      },
      notes: data.notes ?? [],
      timings: {
        first_char_latency_seconds: data.timings.first_char_latency_seconds ?? undefined,
        request_duration_seconds: data.timings.request_duration_seconds ?? undefined,
      },
    }
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`APIVerifier 调用失败: ${error.message}`)
    }
    throw error
  }
}

/**
 * 检查 APIVerifier 服务是否可用
 */
export async function checkApiVerifierHealth(
  config?: DetectServiceConfig
): Promise<boolean> {
  const baseUrl = config?.apiVerifierUrl || DEFAULT_API_VERIFIER_URL

  try {
    const response = await fetch(`${baseUrl}/health`, {
      signal: AbortSignal.timeout(5000),
    })
    return response.ok
  } catch {
    return false
  }
}
