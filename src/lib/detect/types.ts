// 检测服务类型定义

/** 检测结果 */
export interface DetectResult {
  /** 0-100 分数 */
  score: number
  /** 置信等级 */
  level: 'HIGH' | 'MEDIUM' | 'LOW' | 'VERY_LOW'
  /** 判决结果 */
  verdict: 'FRAUD_DETECTED' | 'LEGITIMATE' | 'INCONCLUSIVE'
  /** 详细说明 */
  details: string
  /** 来源服务 */
  source: 'llm-verify' | 'api-verifier' | 'fallback'
  /** 分数明细 */
  breakdown?: {
    knowledge_score?: number
    sse_score?: number
    thinking_score?: number
    usage_score?: number
    penalty_score?: number
  }
  /** 检测说明列表 */
  notes?: string[]
  /** 耗时信息 */
  timings?: {
    first_char_latency_seconds?: number
    request_duration_seconds?: number
  }
}

/** 检测请求 */
export interface DetectRequest {
  /** API 基础 URL */
  url: string
  /** API Key */
  apiKey: string
  /** 模型名称 */
  model: string
  /** 快速检测模式（仅 Claude） */
  quick?: boolean
  /** 自定义检测消息 */
  message?: string
  /** 超时时间（秒） */
  timeout?: number
}

/** 检测服务配置 */
export interface DetectServiceConfig {
  /** llm-verify 服务地址 */
  llmVerifyUrl?: string
  /** APIVerifier 服务地址 */
  apiVerifierUrl?: string
  /** 默认超时时间 */
  timeout?: number
}

/** 默认配置 */
export const DEFAULT_CONFIG: DetectServiceConfig = {
  llmVerifyUrl: process.env.LLM_VERIFY_URL || 'http://localhost:8000',
  apiVerifierUrl: process.env.API_VERIFIER_URL || 'http://localhost:8001',
  timeout: 120,
}

/** APIVerifier 请求格式 */
export interface ApiVerifierRequest {
  url: string
  api_key: string
  model: string
  message?: string
  with_thinking?: boolean
  with_system?: boolean
  timeout?: number
}

/** APIVerifier 响应格式 */
export interface ApiVerifierResponse {
  score: number
  level: string
  verdict: string
  breakdown: {
    knowledge_score: number
    sse_score: number
    thinking_score: number
    usage_score: number
    penalty_score: number
  }
  notes: string[]
  timings: {
    first_char_latency_seconds: number | null
    request_duration_seconds: number | null
  }
}

/** llm-verify 请求格式 */
export interface LlmVerifyRequest {
  name: string
  model_configs: Array<{
    model_name: string
    provider: string
    api_key?: string
    base_url?: string
  }>
  suites: string[]
}

/** llm-verify 响应格式 */
export interface LlmVerifyResponse {
  name: string
  verdict: string
  red_flags: Array<{
    severity: string
    category: string
    description: string
    evidence: string
  }>
  model_reports: unknown[]
  summary: string
}
