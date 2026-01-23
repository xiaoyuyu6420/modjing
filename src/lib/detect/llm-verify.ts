// llm-verify 服务调用（通用深度检测）

import type {
  DetectResult,
  DetectRequest,
  LlmVerifyRequest,
  LlmVerifyResponse,
  DetectServiceConfig,
} from './types'

const DEFAULT_LLM_VERIFY_URL = 'http://localhost:8000'

/**
 * 调用 llm-verify 进行深度检测
 * 通用方案，支持任何 OpenAI 兼容 API
 */
export async function callLlmVerify(
  request: DetectRequest,
  config?: DetectServiceConfig
): Promise<DetectResult> {
  const baseUrl = config?.llmVerifyUrl || DEFAULT_LLM_VERIFY_URL
  const timeout = config?.timeout ?? 180 // 深度检测需要更长时间

  const requestBody: LlmVerifyRequest = {
    name: `检测 ${request.model}`,
    model_configs: [
      {
        model_name: request.model,
        provider: 'suspect',
        base_url: request.url,
      },
    ],
    suites: ['identity', 'capability', 'fingerprint'],
  }

  try {
    const response = await fetch(`${baseUrl}/api/v1/analysis/deep`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${request.apiKey}`,
      },
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(timeout * 1000),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`llm-verify 请求失败: ${response.status} ${errorText}`)
    }

    const data: LlmVerifyResponse = await response.json()

    // 将 red_flags 转换为 notes（防御空值）
    const flags = data.red_flags ?? []
    const notes = flags.map(
      (flag) => `[${flag.severity}] ${flag.category}: ${flag.description} - ${flag.evidence}`
    )

    // 计算分数（基于 red_flags）
    const highFlags = flags.filter((f) => f.severity === 'HIGH').length
    const mediumFlags = flags.filter((f) => f.severity === 'MEDIUM').length
    const score = Math.max(0, 100 - highFlags * 30 - mediumFlags * 10)

    // 确定等级
    let level: DetectResult['level'] = 'HIGH'
    if (score < 35) level = 'VERY_LOW'
    else if (score < 60) level = 'LOW'
    else if (score < 80) level = 'MEDIUM'

    return {
      score,
      level,
      verdict: data.verdict as DetectResult['verdict'],
      details: data.summary,
      source: 'llm-verify',
      notes,
    }
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`llm-verify 调用失败: ${error.message}`)
    }
    throw error
  }
}

/**
 * 检查 llm-verify 服务是否可用
 */
export async function checkLlmVerifyHealth(
  config?: DetectServiceConfig
): Promise<boolean> {
  const baseUrl = config?.llmVerifyUrl || DEFAULT_LLM_VERIFY_URL

  try {
    const response = await fetch(`${baseUrl}/health`, {
      signal: AbortSignal.timeout(5000),
    })
    return response.ok
  } catch {
    return false
  }
}
