/**
 * 探针抽样 —— 确定性加权抽样（纯函数）
 * @see specs/probe-pool/spec.md §5.2
 * @see specs/probe-pool/spec.md §6.5（确定性：同 seed 同结果）
 */
import type { ProbePool, PoolEntry, ProbeCategory } from './contract'

function djb2(s: string): number {
  let h = 5381
  for (let i = 0; i < s.length; i++) {
    h = (h * 33 + s.charCodeAt(i)) & 0xffffffff
  }
  return h >>> 0
}

function randFromSeed(seed: string, id: string): number {
  return djb2(seed + id) / 0xffffffff
}

/**
 * 从 live 池按 category 配比加权抽样 N 道。
 * 同一 seed 必产同一结果（测试断言）。
 */
export function samplePool(
  pool: ProbePool,
  opts: {
    tier: 'keyless' | 'lightweight' | 'deep'
    categories?: Partial<Record<ProbeCategory, number>>
    count: number
    seed: string
  },
): PoolEntry[] {
  const eligible = pool.entries.filter((e) => e.tier === opts.tier && e.status === 'live')
  const result: PoolEntry[] = []
  const picked = new Set<string>()

  // 1. 按 category 配额优先抽
  if (opts.categories) {
    for (const [cat, target] of Object.entries(opts.categories)) {
      const catEntries = eligible.filter((e) => e.category === cat && !picked.has(e.id))
      const scored = catEntries.map((e) => ({
        entry: e,
        score: randFromSeed(opts.seed, e.id) * e.weight,
      }))
      scored.sort((a, b) => b.score - a.score)
      const take = Math.min(scored.length, target)
      for (let i = 0; i < take; i++) {
        result.push(scored[i].entry)
        picked.add(scored[i].entry.id)
      }
    }
  }

  // 2. 配额不足 → 从剩余池加权补齐
  const remaining = eligible.filter((e) => !picked.has(e.id))
  const scored = remaining.map((e) => ({
    entry: e,
    score: randFromSeed(opts.seed + '_fill', e.id) * e.weight,
  }))
  scored.sort((a, b) => b.score - a.score)
  const needed = Math.max(0, opts.count - result.length)
  for (let i = 0; i < needed && i < scored.length; i++) {
    result.push(scored[i].entry)
  }

  return result
}

/** 返回 status 为 public 或 retired 的条目（methodology 用） */
export function pickPublicPool(pool: ProbePool): PoolEntry[] {
  return pool.entries.filter((e) => e.status === 'public' || e.status === 'retired')
}
