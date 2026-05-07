'use client'

import { FakeBandTag } from '@/components/ui/FakeBandTag'
import { OnlineSeqBar, TokenUsageCell } from '@/components/ui/ProbeViz'
import { PriceUnitProvider, PriceUnitToggle, PriceWithUnit, PriceHint } from '@/components/PriceUnit'

type Channel = {
  id: number
  channelName: string
  price: number
  priceOutput: number | null
  priceCached: number | null
  priceCacheCreate: number | null
  priceUnit: string
  multiplier: number
  passRate: number | null
  onlineRate: number | null
  fakeRateBand: string | null
  avgLatencyMs: number | null
  lastProbedAt: string | null
  priceAnomaly: boolean
  tampered: boolean
  weightedScore: number | null
  tokenUsageRatio: number | null
  sampleCount: number | null
  recentOnlineSeq: string | null
  afterSales: string
}

type Group = {
  baseModel: string
  channels: Channel[]
}

export function ModelPriceTable({ groups }: { groups: Group[] }) {
  if (groups.length === 0) {
    return (
      <div className='mj-card p-8 text-center text-stone-400 text-sm'>
        该站点尚未收录任何模型价格
      </div>
    )
  }
  return (
    <PriceUnitProvider>
      <div className='space-y-4'>
        <div className='flex justify-end mb-2'>
          <PriceUnitToggle />
        </div>
        {groups.map((g) => (
          <details key={g.baseModel} open className='mj-card overflow-hidden'>
            <summary className='cursor-pointer px-4 py-3 flex items-center justify-between hover:bg-stone-50'>
              <span className='font-medium text-stone-900'>{g.baseModel}</span>
              <span className='text-xs text-stone-400'>{g.channels.length} 个渠道</span>
            </summary>
            <div className='overflow-x-auto border-t border-stone-100'>
              <table className='w-full text-sm'>
                <thead className='bg-stone-50/60'>
                  <tr className='text-left text-stone-500 text-xs uppercase tracking-wide'>
                    <th className='py-2.5 px-3 font-semibold'>渠道</th>
                    <th className='py-2.5 px-3 font-semibold text-right'>输入价<PriceHint /></th>
                    <th className='py-2.5 px-3 font-semibold text-right'>输出价<PriceHint /></th>
                    <th className='py-2.5 px-3 font-semibold text-right'>缓存价<PriceHint /></th>
                    <th className='py-2.5 px-3 font-semibold text-right'>倍率</th>
                    <th className='py-2.5 px-3 font-semibold text-right'>通过率</th>
                    <th className='py-2.5 px-3 font-semibold text-right'>在线率</th>
                    <th className='py-2.5 px-3 font-semibold text-right' title='实际返回 token / 请求 token，越接近 100% 越不掺水'>Token消耗</th>
                    <th className='py-2.5 px-3 font-semibold text-right'>延迟</th>
                    <th className='py-2.5 px-3 font-semibold'>掺水</th>
                    <th className='py-2.5 px-3 font-semibold text-right'>评分</th>
                    <th className='py-2.5 px-3 font-semibold' title='最近 24 次探测的在线状态'>运行状态</th>
                  </tr>
                </thead>
                <tbody>
                  {g.channels.map((c) => (
                    <tr key={c.id} className='border-t border-stone-100 hover:bg-stone-50/60'>
                      <td className='py-2.5 px-3'>
                        <span className='text-stone-800'>{c.channelName}</span>
                        {c.tampered && (
                          <span className='ml-2 mj-badge border-red-200 bg-red-50 text-red-600'>
                            已掺水
                          </span>
                        )}
                      </td>
                      <td className='py-2.5 px-3 mj-mono text-stone-900 text-right'>
                        <PriceWithUnit price={c.price} />
                        {c.priceAnomaly && <span className='ml-1 text-red-500 text-xs'>!</span>}
                      </td>
                      <td className='py-2.5 px-3 mj-mono text-stone-900 text-right'>
                        <PriceWithUnit price={c.priceOutput} />
                      </td>
                      <td className='py-2.5 px-3 mj-mono text-stone-400 text-right'>
                        <PriceWithUnit price={c.priceCached} />
                      </td>
                      <td className='py-2.5 px-3 mj-mono text-stone-400 text-right'>
                        {c.multiplier.toFixed(2)}x
                      </td>
                      <td className='py-2.5 px-3 mj-mono text-stone-600 text-right'>
                        {fmtPct(c.passRate)}
                      </td>
                      <td className='py-2.5 px-3 mj-mono text-stone-600 text-right'>
                        {fmtPct(c.onlineRate)}
                      </td>
                      <td className='py-2.5 px-3 text-right'>
                        <TokenUsageCell ratio={c.tokenUsageRatio} />
                      </td>
                      <td className='py-2.5 px-3 mj-mono text-stone-600 text-right'>
                        {c.avgLatencyMs == null ? '-' : `${c.avgLatencyMs}ms`}
                      </td>
                      <td className='py-2.5 px-3'>
                        <FakeBandTag band={c.fakeRateBand} />
                      </td>
                      <td className='py-2.5 px-3 mj-mono text-brand-600 text-right'>
                        {c.weightedScore == null ? '-' : c.weightedScore.toFixed(1)}
                      </td>
                      <td className='py-2.5 px-3'>
                        <OnlineSeqBar seq={c.recentOnlineSeq} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        ))}
      </div>
    </PriceUnitProvider>
  )
}

function fmtPct(v: number | null) {
  if (v == null) return '-'
  return `${v.toFixed(1)}%`
}
