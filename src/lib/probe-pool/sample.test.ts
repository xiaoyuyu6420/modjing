/**
 * 抽样测试（确定性 + 配比 + 边界）
 * @see specs/probe-pool/spec.md §5.2（抽样规则）
 * @see specs/probe-pool/spec.md §6.5（确定性）
 */
import { describe, it, expect } from 'vitest'
import { samplePool, pickPublicPool } from './sample'
import { loadLivePool, loadPublicPool } from './pool'

describe('samplePool', () => {
  it('同一 seed 产同一结果（确定性）', () => {
    const pool = loadLivePool()
    const a = samplePool(pool, { tier: 'lightweight', count: 2, seed: 'seed-abc' })
    const b = samplePool(pool, { tier: 'lightweight', count: 2, seed: 'seed-abc' })
    expect(a.map((e) => e.id)).toEqual(b.map((e) => e.id))
  })

  it('count=0 返回空数组', () => {
    const pool = loadLivePool()
    const result = samplePool(pool, { tier: 'lightweight', count: 0, seed: 'x' })
    expect(result.length).toBe(0)
  })

  it('count 受池大小限制（不越界）', () => {
    const pool = loadLivePool()
    const result = samplePool(pool, { tier: 'lightweight', count: 100, seed: 'x' })
    expect(result.length).toBe(pool.entries.length)
    // 无重复
    expect(new Set(result.map((e) => e.id)).size).toBe(result.length)
  })

  it('按 category 配额优先抽，不足再补齐', () => {
    const pool = loadLivePool()
    const result = samplePool(pool, {
      tier: 'lightweight',
      categories: { identity: 2 },
      count: 3,
      seed: 'quota-test',
    })
    // live 池有 2 条 identity，quota=2 应抽满
    const identityCount = result.filter((e) => e.category === 'identity').length
    expect(identityCount).toBe(2)
    // 总条数 = 3
    expect(result.length).toBe(3)
  })

  it('无 eligible 条目时返回空数组', () => {
    const pool = loadLivePool()
    const result = samplePool(pool, { tier: 'deep', count: 3, seed: 'x' })
    expect(result.length).toBe(0)
  })
})

describe('pickPublicPool', () => {
  it('只含 public/retired 条目', () => {
    const pool = loadPublicPool()
    const result = pickPublicPool(pool)
    expect(result.length).toBe(32)
    expect(result.every((e) => e.status === 'public' || e.status === 'retired')).toBe(true)
  })
})
