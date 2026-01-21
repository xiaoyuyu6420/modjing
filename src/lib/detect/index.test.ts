import { describe, it, expect, vi } from 'vitest'
import {
  detectFraud,
  detectWithFallback,
  quickDetect,
  deepDetect,
  checkServicesHealth,
} from './index'
import type { DetectRequest, DetectServiceConfig } from './types'

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

const baseRequest: DetectRequest = {
  url: 'https://api.example.com',
  apiKey: 'sk-test',
  model: 'claude-sonnet-4-20250514',
}

const mockApiVerifierResponse = {
  score: 85,
  level: 'HIGH',
  verdict: 'LEGITIMATE',
  breakdown: {
    knowledge_score: 50,
    sse_score: 18,
    thinking_score: 12,
    usage_score: 10,
    penalty_score: -5,
  },
  notes: ['Test note'],
  timings: {
    first_char_latency_seconds: 0.5,
    request_duration_seconds: 2.0,
  },
}

const mockLlmVerifyResponse = {
  name: 'Test',
  verdict: 'FRAUD_DETECTED',
  red_flags: [
    { severity: 'HIGH', category: 'identity', description: 'Fake', evidence: 'test' },
  ],
  model_reports: [],
  summary: 'Fraud detected',
}

describe('detectFraud', () => {
  it('Claude 模型 + quick 模式 → 调用 APIVerifier', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockApiVerifierResponse,
    })

    const result = await detectFraud({ ...baseRequest, quick: true })

    expect(result.source).toBe('api-verifier')
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('8001'),
      expect.any(Object)
    )
  })

  it('非 Claude 模型 → 调用 llm-verify', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockLlmVerifyResponse,
    })

    const result = await detectFraud({
      url: 'https://api.example.com',
      apiKey: 'sk-test',
      model: 'gpt-5.5',
    })

    expect(result.source).toBe('llm-verify')
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('8000'),
      expect.any(Object)
    )
  })

  it('quick=false 时 Claude 也走 llm-verify', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockLlmVerifyResponse,
    })

    const result = await detectFraud({
      ...baseRequest,
      quick: false,
    })

    expect(result.source).toBe('llm-verify')
  })

  it('传入自定义配置', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockApiVerifierResponse,
    })

    const config: DetectServiceConfig = {
      apiVerifierUrl: 'http://custom:9999',
      timeout: 10,
    }

    await detectFraud({ ...baseRequest, quick: true }, config)

    expect(mockFetch).toHaveBeenCalledWith(
      'http://custom:9999/api/v1/verify/claude',
      expect.any(Object)
    )
  })
})

describe('detectWithFallback', () => {
  it('检测成功返回结果', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockApiVerifierResponse,
    })

    const result = await detectWithFallback({ ...baseRequest, quick: true })

    expect(result.verdict).toBe('LEGITIMATE')
    expect(result.source).toBe('api-verifier')
  })

  it('服务失败时返回降级结果', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Connection refused'))

    const result = await detectWithFallback({ ...baseRequest, quick: true })

    expect(result.verdict).toBe('INCONCLUSIVE')
    expect(result.source).toBe('fallback')
    expect(result.details).toContain('检测服务暂时不可用')
  })
})

describe('quickDetect', () => {
  it('Claude 模型 → 调用 APIVerifier', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockApiVerifierResponse,
    })

    const result = await quickDetect(baseRequest)
    expect(result.source).toBe('api-verifier')
  })
})

describe('deepDetect', () => {
  it('Claude 模型 → 调用 llm-verify', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockLlmVerifyResponse,
    })

    const result = await deepDetect(baseRequest)
    expect(result.source).toBe('llm-verify')
  })
})

describe('checkServicesHealth', () => {
  it('所有服务健康', async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: true }) // llm-verify
      .mockResolvedValueOnce({ ok: true }) // api-verifier

    const result = await checkServicesHealth()

    expect(result.llmVerify).toBe(true)
    expect(result.apiVerifier).toBe(true)
  })

  it('只有 llm-verify 健康', async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: true }) // llm-verify
      .mockRejectedValueOnce(new Error('Timeout')) // api-verifier

    const result = await checkServicesHealth()

    expect(result.llmVerify).toBe(true)
    expect(result.apiVerifier).toBe(false)
  })
})
