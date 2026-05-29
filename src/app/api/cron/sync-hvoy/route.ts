import { NextRequest, NextResponse } from 'next/server'
import { quickSync } from '@/lib/hvoy/sync'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

/**
 * 快速同步 all-channels（cron 高频调用）
 *
 * 逻辑统一在 src/lib/hvoy/sync.ts，本 route 只负责鉴权 + 调用 + 返回。
 * @see specs/data-pipeline/spec.md
 */
export async function GET(req: NextRequest) {
  // 密钥保护：通过 CRON_SECRET 环境变量或 query 参数验证
  const authHeader = req.headers.get('authorization')
  const secret = process.env.CRON_SECRET
  const querySecret = req.nextUrl.searchParams.get('secret')

  if (secret) {
    const provided = authHeader?.replace('Bearer ', '') || querySecret
    if (provided !== secret) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }
  }

  try {
    const result = await quickSync()
    return NextResponse.json({ ok: true, ...result })
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 })
  }
}
