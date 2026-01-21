import { describe, it, expect, vi } from 'vitest'
import { callApiVerifier, checkApiVerifierHealth } from './api-verifier'
import type { DetectRequest, DetectServiceConfig } from './types'

// 全局 fetch mock
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

const baseRequest: DetectRequest = {
  url: 'https://api.example.com',
  apiKey: 'sk-test',
  model: 'claude-sonnet-4-20250514',
}

const baseConfig: DetectServiceConfig = {
  apiVerifierUrl: 'http://test:8001',
  timeout: 30,
}

const mockResponse = (score: number, level: string, verdict: string) => ({
  score,
  level,
  verdict,
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
})

describe('callApiVerifier', () => {
  it('正常返回检测结果', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse(85, 'HIGH', 'LEGITIMATE'),
    })

    const result = await callApiVerifier(baseRequest, baseConfig)

    expect(result.score).toBe(85)
    expect(result.level).toBe('HIGH')
    expect(result.verdict).toBe('LEGITIMATE')
    expect(result.source).toBe('api-verifier')
    expect(result.details).toBe('Test note')
  })

  it('使用默认配置（不传入 config）', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse(70, 'MEDIUM', 'LEGITIMATE'),
    })

    const result = await callApiVerifier(baseRequest)

    expect(result.score).toBe(70)
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:8001/api/v1/verify/claude',
      expect.any(Object)
    )
  })

  it('HTTP 错误时抛出异常', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: async () => 'Internal Server Error',
    })

    await expect(callApiVerifier(baseRequest)).rejects.toThrow('APIVerifier 请求失败: 500')
  })

  it('网络错误时抛出异常', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Connection refused'))

    await expect(callApiVerifier(baseRequest)).rejects.toThrow('APIVerifier 调用失败: Connection refused')
  })

  it('处理 null/undefined notes', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        ...mockResponse(85, 'HIGH', 'LEGITIMATE'),
        notes: null,
      }),
    })

    const result = await callApiVerifier(baseRequest, baseConfig)
    expect(result.details).toBe('')
    expect(result.notes).toEqual([])
  })

  it('timeout 为 0 时保留 0 而不是用默认值', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse(85, 'HIGH', 'LEGITIMATE'),
    })

    await callApiVerifier(baseRequest, { timeout: 0 })
    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        signal: expect.any(AbortSignal),
      })
    )
  })
})

describe('checkApiVerifierHealth', () => {
  it('服务健康返回 true', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true })

    const result = await checkApiVerifierHealth(baseConfig)
    expect(result).toBe(true)
  })

  it('服务不可用返回 false', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Connection refused'))

    const result = await checkApiVerifierHealth(baseConfig)
    expect(result).toBe(false)
  })
})
