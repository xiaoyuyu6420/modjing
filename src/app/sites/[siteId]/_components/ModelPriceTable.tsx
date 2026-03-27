import { FakeBandTag } from '@/components/ui/FakeBandTag'

type Channel = {
  id: number
  channelName: string
  price: number
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
    <div className='space-y-4'>
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
                  <th className='py-2.5 px-3 font-semibold text-right'>价格(¥/M)</th>
                  <th className='py-2.5 px-3 font-semibold text-right'>倍率</th>
                  <th className='py-2.5 px-3 font-semibold text-right'>通过率</th>
                  <th className='py-2.5 px-3 font-semibold text-right'>在线率</th>
                  <th className='py-2.5 px-3 font-semibold text-right'>延迟</th>
                  <th className='py-2.5 px-3 font-semibold'>掺水</th>
                  <th className='py-2.5 px-3 font-semibold text-right'>评分</th>
                  <th className='py-2.5 px-3 font-semibold'>最近探测</th>
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
                      {c.price.toFixed(2)}
                      {c.priceAnomaly && <span className='ml-1 text-red-500 text-xs'>!</span>}
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
                    <td className='py-2.5 px-3 mj-mono text-stone-600 text-right'>
                      {c.avgLatencyMs == null ? '-' : `${c.avgLatencyMs}ms`}
                    </td>
                    <td className='py-2.5 px-3'>
                      <FakeBandTag band={c.fakeRateBand} />
                    </td>
                    <td className='py-2.5 px-3 mj-mono text-brand-600 text-right'>
                      {c.weightedScore == null ? '-' : c.weightedScore.toFixed(1)}
                    </td>
                    <td className='py-2.5 px-3 text-stone-400 text-xs'>
                      {c.lastProbedAt
                        ? new Date(c.lastProbedAt).toLocaleString('zh-CN', {
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      ))}
    </div>
  )
}

function fmtPct(v: number | null) {
  if (v == null) return '-'
  return `${v.toFixed(1)}%`
}
