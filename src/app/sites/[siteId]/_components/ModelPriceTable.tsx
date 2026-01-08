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
      <div className='border border-gray-800 rounded-lg p-8 text-center text-gray-500 text-sm'>
        该站点尚未收录任何模型价格
      </div>
    )
  }
  return (
    <div className='space-y-4'>
      {groups.map((g) => (
        <details
          key={g.baseModel}
          open
          className='border border-gray-800 rounded-lg overflow-hidden bg-gray-900/30'
        >
          <summary className='cursor-pointer px-4 py-3 flex items-center justify-between hover:bg-gray-900/60'>
            <span className='font-medium text-gray-100'>{g.baseModel}</span>
            <span className='text-xs text-gray-500'>{g.channels.length} 个渠道</span>
          </summary>
          <div className='overflow-x-auto border-t border-gray-800'>
            <table className='w-full text-sm'>
              <thead className='bg-gray-900/50'>
                <tr className='text-left text-gray-400 text-xs'>
                  <th className='py-2 px-3 font-medium'>渠道</th>
                  <th className='py-2 px-3 font-medium'>价格(¥/M)</th>
                  <th className='py-2 px-3 font-medium'>倍率</th>
                  <th className='py-2 px-3 font-medium'>通过率</th>
                  <th className='py-2 px-3 font-medium'>在线率</th>
                  <th className='py-2 px-3 font-medium'>延迟</th>
                  <th className='py-2 px-3 font-medium'>掺水</th>
                  <th className='py-2 px-3 font-medium'>评分</th>
                  <th className='py-2 px-3 font-medium'>最近探测</th>
                </tr>
              </thead>
              <tbody>
                {g.channels.map((c) => (
                  <tr
                    key={c.id}
                    className='border-t border-gray-800/60 hover:bg-gray-900/40'
                  >
                    <td className='py-2 px-3'>
                      <span className='text-gray-200'>{c.channelName}</span>
                      {c.tampered && (
                        <span className='ml-2 inline-block px-1.5 py-0.5 rounded text-[10px] border border-red-800/50 text-red-300 bg-red-900/30'>
                          已掺水
                        </span>
                      )}
                    </td>
                    <td className='py-2 px-3 font-mono text-gray-300'>
                      {c.price.toFixed(2)}
                      {c.priceAnomaly && (
                        <span className='ml-1 text-red-400 text-xs'>!</span>
                      )}
                    </td>
                    <td className='py-2 px-3 font-mono text-gray-400'>
                      {c.multiplier.toFixed(2)}x
                    </td>
                    <td className='py-2 px-3 text-gray-300'>
                      {fmtPct(c.passRate)}
                    </td>
                    <td className='py-2 px-3 text-gray-300'>
                      {fmtPct(c.onlineRate)}
                    </td>
                    <td className='py-2 px-3 text-gray-300'>
                      {c.avgLatencyMs == null ? '-' : `${c.avgLatencyMs}ms`}
                    </td>
                    <td className='py-2 px-3'>
                      <FakeBandTag band={c.fakeRateBand} />
                    </td>
                    <td className='py-2 px-3 font-mono text-blue-400'>
                      {c.weightedScore == null ? '-' : c.weightedScore.toFixed(1)}
                    </td>
                    <td className='py-2 px-3 text-gray-500 text-xs'>
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
