'use client'

import { useState } from 'react'
import Link from 'next/link'
import { PriceUnitProvider, PriceUnitToggle, PriceWithUnit } from '@/components/PriceUnit'
import { OnlineSeqBar, TokenUsageCell } from '@/components/ui/ProbeViz'

export type ModelTop = {
  id: number
  siteId: number
  siteName: string
  channel: string
  price: number
  priceOutput: number | null
  passRate: number | null
  onlineRate: number | null
  weightedScore: number | null
  tokenUsageRatio: number | null
  recentOnlineSeq: string | null
  url: string
}

export default function LeaderboardTabs({ tabs, data }: { tabs: string[]; data: Record<string, ModelTop[]> }) {
  const [active, setActive] = useState(tabs[0])
  const rows = data[active] ?? []

  return (
    <PriceUnitProvider>
      <div>
        <div className='flex flex-wrap items-center justify-between gap-2 mb-4 border-b border-stone-200'>
          <div className='flex flex-wrap gap-1 -mb-px'>
            {tabs.map((t) => (
              <button
                key={t}
                onClick={() => setActive(t)}
                className={`px-3 py-2 text-sm transition-colors border-b-2 ${
                  active === t
                    ? 'border-brand-600 text-brand-700 font-medium'
                    : 'border-transparent text-stone-500 hover:text-stone-800'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          <PriceUnitToggle />
        </div>

        <div className='mj-table-wrap'>
          <table className='mj-table'>
            <thead>
              <tr>
                <th className='mj-th w-12 text-center'>#</th>
                <th className='mj-th'>站点</th>
                <th className='mj-th'>渠道</th>
                <th className='mj-th text-right'>输入价</th>
                <th className='mj-th text-right'>输出价</th>
                <th className='mj-th text-right'>通过率</th>
                <th className='mj-th text-right'>Token消耗</th>
                <th className='mj-th text-right'>评分</th>
                <th className='mj-th'>运行状态</th>
                <th className='mj-th'></th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={10} className='py-12 text-center text-stone-400'>暂无数据</td>
                </tr>
              ) : (
                rows.map((r, i) => (
                  <tr key={r.id} className='mj-row'>
                    <td className='mj-td text-center'>
                      <span
                        className={`inline-flex items-center justify-center w-6 h-6 rounded-md text-xs mj-mono ${
                          i < 3
                            ? 'bg-brand-50 text-brand-700 font-semibold ring-1 ring-brand-200'
                            : 'text-stone-400'
                        }`}
                      >
                        {i + 1}
                      </span>
                    </td>
                    <td className='mj-td'>
                      <Link href={`/sites/${r.siteId}`} className='font-medium text-stone-900 hover:text-brand-700'>
                        {r.siteName}
                      </Link>
                    </td>
                    <td className='mj-td text-xs text-stone-400'>{r.channel}</td>
                    <td className='mj-td text-right mj-mono text-stone-900'>
                      <PriceWithUnit price={r.price} />
                    </td>
                    <td className='mj-td text-right mj-mono text-stone-600'>
                      <PriceWithUnit price={r.priceOutput} />
                    </td>
                    <td className='mj-td text-right mj-mono text-stone-600'>
                      {r.passRate == null ? '-' : `${r.passRate.toFixed(1)}%`}
                    </td>
                    <td className='mj-td text-right'>
                      <TokenUsageCell ratio={r.tokenUsageRatio} />
                    </td>
                    <td className='mj-td text-right mj-mono text-stone-900 font-medium'>
                      {r.weightedScore == null ? '-' : r.weightedScore.toFixed(1)}
                    </td>
                    <td className='mj-td'>
                      <OnlineSeqBar seq={r.recentOnlineSeq} />
                    </td>
                    <td className='mj-td'>
                      <a
                        href={r.url}
                        target='_blank'
                        rel='noreferrer noopener'
                        className='mj-btn-ghost px-2.5 py-1 text-xs'
                      >
                        访问
                      </a>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </PriceUnitProvider>
  )
}
