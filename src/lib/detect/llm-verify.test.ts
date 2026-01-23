import { describe, it, expect, vi } from 'vitest'
import { callLlmVerify, checkLlmVerifyHealth } from './llm-verify'
import type { DetectRequest, DetectServiceConfig } from './types'

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

const baseRequest: DetectRequest = {
  url: 'https://api.example.com',
  apiKey: 'sk-test',
  model: 'gpt-5.5',
}

const baseConfig: DetectServiceConfig = {
  llmVerifyUrl: 'http://test:8000',
  timeout: 60,
}

const mockLlmVerifyResponse = (verdict: string, redFlags: unknown[]) => ({
  name: 'Test',
  verdict,
  red_flags: redFlags,
  model_reports: [],
  summary: 'Test summary',
})

describe('callLlmVerify', () => {
  it('正常返回检测结果', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockLlmVerifyResponse('LEGITIMATE', []),
    })

    const result = await callLlmVerify(baseRequest, baseConfig)

    expect(result.verdict).toBe('LEGITIMATE')
    expect(result.source).toBe('llm-verify')
    expect(result.score).toBe(100)
    expect(result.level).toBe('HIGH')
  })

  it('有 red_flags 时正确计算分数', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockLlmVerifyResponse('FRAUD_DETECTED', [
        { severity: 'HIGH', category: 'identity', description: 'Fake', evidence: 'test' },
        { severity: 'MEDIUM', category: 'latency', description: 'Slow', evidence: 'test' },
      ]),
    })

    const result = await callLlmVerify(baseRequest, baseConfig)
    expect(result.score).toBe(60)
    expect(result.level).toBe('MEDIUM')
    expect(result.verdict).toBe('FRAUD_DETECTED')
    expect(result.notes).toHaveLength(2)
  })

  it('使用默认配置', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockLlmVerifyResponse('LEGITIMATE', []),
    })

    await callLlmVerify(baseRequest)
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:8000/api/v1/analysis/deep',
      expect.any(Object)
    )
  })

  it('HTTP 错误时抛出异常', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 503,
      text: async () => 'Service Unavailable',
    })

    await expect(callLlmVerify(baseRequest)).rejects.toThrow('llm-verify 请求失败: 503')
  })

  it('red_flags 为 null 时不崩溃', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        ...mockLlmVerifyResponse('INCONCLUSIVE', []),
        red_flags: null,
      }),
    })

    const result = await callLlmVerify(baseRequest, baseConfig)
    expect(result.notes).toEqual([])
    expect(result.score).toBe(100)
  })

  it('timeout 为 0 时保留 0', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockLlmVerifyResponse('LEGITIMATE', []),
    })

    await callLlmVerify(baseRequest, { timeout: 0 })
    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        signal: expect.any(AbortSignal),
      })
    )
  })
})

describe('checkLlmVerifyHealth', () => {
  it('服务健康返回 true', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true })
    expect(await checkLlmVerifyHealth(baseConfig)).toBe(true)
  })

  it('服务不可用返回 false', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Timeout'))
    expect(await checkLlmVerifyHealth(baseConfig)).toBe(false)
  })
})
