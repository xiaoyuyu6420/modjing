/**
 * 池加载 + schema 护栏测试
 * @see specs/probe-pool/spec.md §4（契约）/ §7（成功标准：非法 schema 被拒）
 */
import { describe, it, expect } from 'vitest'
import { loadLivePool, loadPublicPool, getCurrentVersion } from './pool'
import { ProbePoolSchema } from './contract'

describe('live 池', () => {
  it('解析通过，version 非空', () => {
    const pool = loadLivePool()
    expect(pool.version).toBeTruthy()
    expect(getCurrentVersion()).toBe(pool.version)
  })

  it('含 identity-cutoff 现役探针 + cutoff 基线', () => {
    const pool = loadLivePool()
    const cutoff = pool.entries.find((e) => e.id === 'identity-cutoff')
    expect(cutoff).toBeTruthy()
    expect(cutoff!.status).toBe('live')
    expect(cutoff!.baseline?.models['claude-opus-4-8']?.cutoffYear).toBe(2025)
    expect(cutoff!.expectedTokens).toBe(22)
  })

  it('所有 live 条目 status=live', () => {
    const pool = loadLivePool()
    expect(pool.entries.length).toBeGreaterThanOrEqual(3)
    expect(pool.entries.every((e) => e.status === 'live')).toBe(true)
  })
})

describe('public 池', () => {
  it('解析通过，含 32 道范例（10 身份 / 10 能力 / 12 指纹）', () => {
    const pool = loadPublicPool()
    expect(pool.entries.length).toBe(32)
    const byCat = (c: string) => pool.entries.filter((e) => e.category === c).length
    expect(byCat('identity')).toBe(10)
    expect(byCat('capability')).toBe(10)
    expect(byCat('fingerprint')).toBe(12)
  })

  it('所有 public 条目 status=public（与 live 物理隔离）', () => {
    const pool = loadPublicPool()
    expect(pool.entries.every((e) => e.status === 'public')).toBe(true)
  })
})

describe('schema 护栏（spec §7）', () => {
  it('非法 category 被拒', () => {
    const live = loadLivePool()
    const bad = {
      ...live,
      entries: [{ ...live.entries[0], category: 'bogus' as unknown }],
    }
    expect(ProbePoolSchema.safeParse(bad).success).toBe(false)
  })

  it('缺失必填字段（prompt）被拒', () => {
    const live = loadLivePool()
    const { prompt: _omit, ...rest } = live.entries[0]
    const bad = { ...live, entries: [rest] }
    expect(ProbePoolSchema.safeParse(bad).success).toBe(false)
  })
})
