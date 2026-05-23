import { describe, it, expect } from 'vitest'
import { runProbe } from './probe'

// mock fetch 的工厂函数
function mockFetchOnce(response: unknown, init?: { ok?: boolean; status?: number }) {
  const ok = init?.ok ?? true
  const status = init?.status ?? 200
  globalThis.fetch = vi.fn().mockResolvedValue({
    ok,
    status,
    json: async () => response,
    text: async () => JSON.stringify(response),
  }) as any
}

import { vi } from 'vitest'

describe('runProbe', () => {
  it('正常响应应判定为 LEGITIMATE', async () => {
    mockFetchOnce({
      choices: [{ message: { content: 'My knowledge cutoff is early 2025.' } }],
      usage: { prompt_tokens: 20, completion_tokens: 15 },
    })

    const result = await runProbe({
      baseUrl: 'https://api.example.com',
      apiKey: 'sk-test',
      model: 'claude-opus-4-8',
    })

    expect(result.verdict).toBe('LEGITIMATE')
    expect(result.score).toBeGreaterThanOrEqual(80)
    expect(result.tokenUsageRatio).not.toBeNull()
    expect(result.latencyMs).not.toBeNull()
  })

  it('知识截止年份过低应判定掺水', async () => {
    mockFetchOnce({
      choices: [{ message: { content: 'My knowledge cutoff is April 2023.' } }],
      usage: { prompt_tokens: 20, completion_tokens: 10 },
    })

    const result = await runProbe({
      baseUrl: 'https://api.example.com',
      apiKey: 'sk-test',
      model: 'claude-opus-4-8',
    })

    const cutoffCheck = result.details.find((d) => d.check === 'knowledge_cutoff')
    expect(cutoffCheck?.passed).toBe(false)
    expect(cutoffCheck?.message).toContain('旧模型伪装')
  })

  it('prompt_tokens 异常低应标记 usage 可疑', async () => {
    mockFetchOnce({
      choices: [{ message: { content: 'Cutoff is January 2025.' } }],
      usage: { prompt_tokens: 2, completion_tokens: 5 },
    })

    const result = await runProbe({
      baseUrl: 'https://api.example.com',
      apiKey: 'sk-test',
      model: 'claude-opus-4-8',
    })

    const usageCheck = result.details.find((d) => d.check === 'token_usage')
    expect(usageCheck?.passed).toBe(false)
    expect(result.tokenUsageRatio).toBeLessThan(0.3)
  })

  it('请求失败应判定 INCONCLUSIVE', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('network error')) as any

    const result = await runProbe({
      baseUrl: 'https://api.example.com',
      apiKey: 'sk-test',
      model: 'gpt-5.5',
    })

    expect(result.verdict).toBe('INCONCLUSIVE')
    expect(result.score).toBe(0)
    expect(result.details[0].check).toBe('connectivity')
    expect(result.details[0].passed).toBe(false)
  })

  it('HTTP 401 应判定 INCONCLUSIVE', async () => {
    mockFetchOnce({ error: 'invalid api key' }, { ok: false, status: 401 })

    const result = await runProbe({
      baseUrl: 'https://api.example.com',
      apiKey: 'sk-wrong',
      model: 'gpt-5.5',
    })

    expect(result.verdict).toBe('INCONCLUSIVE')
    expect(result.details[0].message).toContain('401')
  })

  it('normalizeBase 应处理尾部斜杠和 /v1', async () => {
    // 间接验证：发请求时 URL 拼接正确
    let capturedUrl = ''
    globalThis.fetch = vi.fn().mockImplementation((url: string) => {
      capturedUrl = url
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({ choices: [{ message: { content: '2025' } }], usage: { prompt_tokens: 20 } }),
        text: async () => '{}',
      })
    }) as any

    await runProbe({
      baseUrl: 'https://api.example.com/v1/',
      apiKey: 'sk-test',
      model: 'claude-opus-4-8',
    })

    expect(capturedUrl).toBe('https://api.example.com/v1/chat/completions')
  })
})
