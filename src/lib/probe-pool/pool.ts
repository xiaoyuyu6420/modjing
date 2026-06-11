/**
 * 池加载器 —— 解析 + 缓存。解析失败抛 ZodError（spec §6.6）。
 * @see specs/probe-pool/spec.md §4
 *
 * 反规避（spec §6.1）：本文件仅供服务端代码 import。methodology（server component）
 * 读 loadPublicPool() 安全；client 组件**不可** import 本文件（会传递引入 live prompt）。
 */
import { ProbePoolSchema, type ProbePool } from './contract'
import { livePoolData } from './live-pool'
import { publicPoolData } from './public-pool'

let _live: ProbePool | null = null
let _public: ProbePool | null = null

export function loadLivePool(): ProbePool {
  if (!_live) _live = ProbePoolSchema.parse(livePoolData)
  return _live
}

export function loadPublicPool(): ProbePool {
  if (!_public) _public = ProbePoolSchema.parse(publicPoolData)
  return _public
}

export function getCurrentVersion(): string {
  return loadLivePool().version
}
