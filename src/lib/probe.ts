/**
 * 模镜内置轻量探针（兼容层）
 *
 * 实现已迁入 src/lib/probe-pool/transform.ts。本文件保留旧类型声明与
 * runProbe 导出，供 /api/probe/route.ts 和旧测试兼容。
 *
 * 新代码请使用 src/lib/probe-pool 的 API（runLightweightProbe / runProbe）。
 */
import { runProbe as _runProbe } from './probe-pool/transform'

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
  // 新增（向后兼容，旧代码不读取这些字段）
  poolVersion?: string
  tiers?: { keyless: { run: number; passed: number }; lightweight: { run: number; passed: number }; deep: { run: number; passed: number } }
  billingMultiplier?: number | null
}

export async function runProbe(input: ProbeInput): Promise<ProbeOutput> {
  // 新 ProbeOutput 是旧 ProbeOutput 的结构超集（保留所有旧字段），直接返回
  return (await _runProbe(input)) as ProbeOutput
}
