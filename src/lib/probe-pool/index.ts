/**
 * 探针池 lib —— 服务端统一出口。
 *
 * ⚠️ 反规避（spec §6.1，#16）：本 barrel 传递引入 live-pool.ts（现役 prompt），
 * 故 **仅供服务端代码**（route.ts / transform.ts / methodology server component）import。
 * **禁止** client 组件 import 本文件 → 阶段 4 用 build 产物 grep 验证 live prompt 不在 client chunk。
 *
 * @see specs/probe-pool/spec.md
 */
export * from './contract'
export { loadLivePool, loadPublicPool, getCurrentVersion } from './pool'
export {
  verdictFromScore,
  summarizeTiers,
  computeMainScore,
  DILUTION_RATIO_THRESHOLD,
  BILLING_MULTIPLIER_PENALTY_THRESHOLD,
  BILLING_MULTIPLIER_PENALTY,
} from './scoring'
