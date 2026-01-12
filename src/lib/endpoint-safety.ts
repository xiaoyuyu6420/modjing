const HOST_RE = /^[A-Za-z0-9\-_.]{1,512}$/

export function isValidHostname(h: string): boolean {
  return HOST_RE.test(h.trim())
}

export function isValidApiKey(k: string): boolean {
  return k.trim().length > 0 && k.trim().length <= 256
}

export function isValidEndpointUrl(u: string): boolean {
  const t = u.trim()
  if (!t || t.length > 256) return false
  try {
    const url = new URL(t)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

function normalize(h: string): string {
  return h.trim().replace(/^\[|\]$/g, '').replace(/\.$/, '').toLowerCase()
}

function extractHostname(u: string): string {
  const t = u.trim()
  if (!t) return ''
  try {
    return normalize(new URL(t.includes('://') ? t : `https://${t}`).hostname)
  } catch {
    return ''
  }
}

function isPrivateIPv4(h: string): boolean {
  if (!/^\d{1,3}(?:\.\d{1,3}){3}$/.test(h)) return false
  const parts = h.split('.').map((p) => Number(p))
  if (parts.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) return false
  const [a, b] = parts
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 198 && (b === 18 || b === 19)) ||
    a >= 224
  )
}

function parseIPv6(h: string): number[] | null {
  let t = h
  if (t.includes('.')) {
    const i = t.lastIndexOf(':')
    if (i === -1) return null
    const m = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(t.slice(i + 1))
    if (!m) return null
    const v = m.slice(1).map((n) => Number(n))
    if (v.some((n) => n < 0 || n > 255)) return null
    t = `${t.slice(0, i)}:${((v[0] << 8) | v[1]).toString(16)}:${((v[2] << 8) | v[3]).toString(16)}`
  }
  const parts = t.split('::')
  if (parts.length > 2) return null
  const left = parts[0] ? parts[0].split(':').filter(Boolean) : []
  const right = parts[1] ? parts[1].split(':').filter(Boolean) : []
  if (parts.length === 1 && left.length !== 8) return null
  if (left.length + right.length > 8) return null
  const fill = 8 - (left.length + right.length)
  const groups =
    parts.length === 2
      ? [...left, ...Array.from({ length: fill }, () => '0'), ...right]
      : left
  if (groups.length !== 8) return null
  const nums = groups.map((g) => (/^[0-9a-f]{1,4}$/i.test(g) ? parseInt(g, 16) : NaN))
  return nums.some((n) => Number.isNaN(n)) ? null : nums
}

function isPrivateIPv6(h: string): boolean {
  const t = h.toLowerCase()
  if (!t.includes(':')) return false
  if (
    t === '::' ||
    t === '::1' ||
    t.startsWith('fe80:') ||
    t.startsWith('fe90:') ||
    t.startsWith('fea0:') ||
    t.startsWith('feb0:') ||
    t.startsWith('fc') ||
    t.startsWith('fd')
  )
    return true
  const parsed = parseIPv6(t)
  if (!parsed) return false
  const first = parsed[0]
  return (
    first === 0 ||
    (first & 0xfe00) === 0xfc00 ||
    (first & 0xffc0) === 0xfe80 ||
    (first & 0xff00) === 0xff00
  )
}

function isBlockedHostname(h: string): boolean {
  if (!h) return false
  return !!(
    h === 'localhost' ||
    h.endsWith('.localhost') ||
    h.endsWith('.local') ||
    h.endsWith('.internal') ||
    h.endsWith('.lan') ||
    h.endsWith('.home.arpa') ||
    isPrivateIPv4(h) ||
    isPrivateIPv6(h)
  )
}

export function isPublicEndpoint(url: string): boolean {
  if (!isValidEndpointUrl(url)) return false
  const host = extractHostname(url)
  if (!host) return false
  return !isBlockedHostname(host)
}

export function endpointBlockReason(url: string): string | null {
  if (!isValidEndpointUrl(url)) return '无效 URL，必须是 http(s)://'
  const host = extractHostname(url)
  if (!host) return '无法解析主机名'
  if (isBlockedHostname(host)) return '禁止内网/本地/私有 IP 地址'
  return null
}
