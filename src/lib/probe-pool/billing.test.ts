/**
 * 计费指纹测试
 * @see specs/probe-pool/spec.md §5.4
 */
import { describe, it, expect } from 'vitest'
import { vi } from 'vitest'
import { probeBilling } from './billing'

function mockFetch(handlers: { match: (url: string) => boolean; response: () => any }[]) {
  globalThis.fetch = vi.fn().mockImplementation(async (url: string) => {
    for (const h of handlers) {
      if (h.match(url)) {
        const res = h.response()
        return res
      }
    }
    return { ok: false, status: 404, json: async () => ({}), text: async () => 'not found' }
  }) as any
}

describe('probeBilling', () => {
  it('billing 端点 404 → fakeOrDisabled=true', async () => {
    mockFetch([
      {
        match: (u) => u.includes('/billing/subscription'),
        response: () => ({ ok: false, status: 404, json: async () => ({ error: 'not found' }), text: async () => 'not found' }),
      },
    ])
    const result = await probeBilling({ baseUrl: 'https://api.example.com', apiKey: 'sk-test', price: 10 })
    expect(result.fakeOrDisabled).toBe(true)
    expect(result.endpointAvailable).toBe(false)
  })

  it('billing 端点返回伪造结构 → fakeOrDisabled=true', async () => {
    mockFetch([
      {
        match: (u) => u.includes('/billing/subscription'),
        response: () => ({ ok: true, status: 200, json: async () => ({ foo: 'bar' }), text: async () => '{}' }),
      },
    ])
    const result = await probeBilling({ baseUrl: 'https://api.example.com', apiKey: 'sk-test', price: 10 })
    expect(result.fakeOrDisabled).toBe(true)
  })

  it('billing 端点正常 + usage 正常 → fakeOrDisabled=false，multiplier 可算', async () => {
    mockFetch([
      {
        match: (u) => u.includes('/billing/subscription'),
        response: () => ({ ok: true, status: 200, json: async () => ({ hard_limit_usd: 120 }), text: async () => '{}' }),
      },
      {
        match: (u) => u.includes('/billing/usage'),
        response: () => ({ ok: true, status: 200, json: async () => ({ total_usage: 5000 }), text: async () => '{}' }),
      },
      {
        match: (u) => u.includes('/chat/completions'),
        response: () => ({
          ok: true, status: 200,
          json: async () => ({ choices: [{ message: { content: 'hi' } }], usage: { prompt_tokens: 1, completion_tokens: 1 } }),
          text: async () => '{}',
        }),
      },
    ])
    const result = await probeBilling({ baseUrl: 'https://api.example.com', apiKey: 'sk-test', price: 10, model: 'gpt-3.5-turbo' })
    expect(result.fakeOrDisabled).toBe(false)
    expect(result.endpointAvailable).toBe(true)
    expect(result.subscription?.hardLimitUsd).toBe(120)
    expect(result.usageTotalUsd).toBe(50)
    expect(result.chargedEstimateUsd).toBeGreaterThan(0)
    expect(result.multiplier).toBeGreaterThan(0)
  })

  it('无 price 时 multiplier 为 null，但不标记 fakeOrDisabled', async () => {
    mockFetch([
      {
        match: (u) => u.includes('/billing/subscription'),
        response: () => ({ ok: true, status: 200, json: async () => ({ hard_limit_usd: 100 }), text: async () => '{}' }),
      },
      {
        match: (u) => u.includes('/billing/usage'),
        response: () => ({ ok: true, status: 200, json: async () => ({ total_usage: 1000 }), text: async () => '{}' }),
      },
    ])
    const result = await probeBilling({ baseUrl: 'https://api.example.com', apiKey: 'sk-test' })
    expect(result.fakeOrDisabled).toBe(false)
    expect(result.endpointAvailable).toBe(true)
    expect(result.multiplier).toBeNull()
  })
})
