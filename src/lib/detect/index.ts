// 检测服务主入口

import type { DetectResult, DetectRequest, DetectServiceConfig } from './types'
import { DEFAULT_CONFIG } from './types'
import { callApiVerifier, checkApiVerifierHealth } from './api-verifier'
import { callLlmVerify, checkLlmVerifyHealth } from './llm-verify'

export type { DetectResult, DetectRequest, DetectServiceConfig }

/**
 * 检测 API 是否欺诈/掺水
 *
 * @param request 检测请求
 * @param config 服务配置
 * @returns 检测结果
 */
export async function detectFraud(
  request: DetectRequest,
  config?: DetectServiceConfig
): Promise<DetectResult> {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config }

  // 判断是否为 Claude 模型（防御类型错误）
  const isClaude = typeof request.model === 'string' &&
    request.model.toLowerCase().includes('claude')

  // 快速检测模式 + Claude 模型 → 使用 APIVerifier
  if (request.quick && isClaude) {
    return await callApiVerifier(request, mergedConfig)
  }

  // 其他情况 → 使用 llm-verify 深度检测
  return await callLlmVerify(request, mergedConfig)
}

/**
 * 带降级策略的检测
 * 当检测服务不可用时，返回待人工审核的结果
 */
export async function detectWithFallback(
  request: DetectRequest,
  config?: DetectServiceConfig
): Promise<DetectResult> {
  try {
    return await detectFraud(request, config)
  } catch (error) {
    // 检测服务不可用，返回待人工审核
    return {
      score: 0,
      level: 'LOW',
      verdict: 'INCONCLUSIVE',
      details: `检测服务暂时不可用，待人工审核。错误: ${error instanceof Error ? error.message : '未知错误'}`,
      source: 'fallback',
    }
  }
}

/**
 * 检查所有检测服务的健康状态
 */
export async function checkServicesHealth(
  config?: DetectServiceConfig
): Promise<{
  llmVerify: boolean
  apiVerifier: boolean
}> {
  const [llmVerify, apiVerifier] = await Promise.all([
    checkLlmVerifyHealth(config),
    checkApiVerifierHealth(config),
  ])

  return { llmVerify, apiVerifier }
}

/**
 * 快速检测（仅 Claude）
 * 单次请求，秒级返回
 */
export async function quickDetect(
  request: DetectRequest,
  config?: DetectServiceConfig
): Promise<DetectResult> {
  return await detectFraud({ ...request, quick: true }, config)
}

/**
 * 深度检测
 * 多探针，分钟级返回
 */
export async function deepDetect(
  request: DetectRequest,
  config?: DetectServiceConfig
): Promise<DetectResult> {
  return await detectFraud({ ...request, quick: false }, config)
}
