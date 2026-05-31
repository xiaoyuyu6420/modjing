/**
 * hvoy HTTP 请求封装
 *
 * @see specs/data-pipeline/spec.md §4 （端点定义）
 *
 * 仅负责取数（返回 unknown）。响应的 zod 校验由调用方做
 * （spec §6 不变量 4：校验失败抛错，不静默 null）。
 */

export const HVOY_BASE = 'https://hvoy.ai'

/**
 * 从 hvoy 拉取 JSON。HTTP 非 2xx 抛错。
 * 返回 unknown —— 调用方须用 contract.ts 的 schema 校验后再用。
 */
export async function fetchJson(path: string): Promise<unknown> {
  const res = await fetch(`${HVOY_BASE}${path}`, {
    headers: { Accept: 'application/json' },
  })
  if (!res.ok) throw new Error(`${path} -> HTTP ${res.status}`)
  return res.json()
}
