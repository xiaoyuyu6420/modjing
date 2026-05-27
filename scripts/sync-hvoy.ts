/**
 * hvoy 同步 CLI —— 调 src/lib/hvoy/sync.ts
 *
 * 用法：
 *   npm run sync-hvoy          快速同步（quickSync）
 *   npm run sync-hvoy:full     全量同步（fullSync）
 *
 * @see specs/data-pipeline/spec.md
 */
import { prisma } from '../src/lib/prisma'
import { quickSync, fullSync } from '../src/lib/hvoy/sync'

const mode = process.argv[2]

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())

async function main() {
  if (mode === '--full') {
    console.log('🔄 全量同步 providers + site-details...')
    const start = Date.now()
    const r = await fullSync()
    console.log('---')
    console.log(`站点：新增 ${r.siteUpserted}，跳过 ${r.siteSkipped}`)
    console.log(`渠道 upsert：${r.channelUpdated}`)
    console.log(`错误：${r.errored}`)
    if (r.quick) {
      console.log(`追加 quickSync：更新 ${r.quick.updated}/${r.quick.total}，跳过 ${r.quick.skipped}，错误 ${r.quick.errored}，新增历史 ${r.quick.newHistory}`)
    }
    console.log(`耗时：${((Date.now() - start) / 1000).toFixed(1)}s`)
  } else {
    console.log('⚡ 快速同步 all-channels...')
    const start = Date.now()
    const r = await quickSync()
    console.log('---')
    console.log(`更新：${r.updated} / 跳过：${r.skipped} / 错误：${r.errored}（总计 ${r.total}）`)
    console.log(`新增价格历史：${r.newHistory} 条`)
    console.log(`updatedAt：${r.updatedAt}`)
    console.log(`耗时：${((Date.now() - start) / 1000).toFixed(1)}s`)
  }
}
