'use client'

import { useState } from 'react'
import Link from 'next/link'

export type ModelTop = {
  id: number
  siteId: number
  siteName: string
  channel: string
  price: number
  passRate: number | null
  onlineRate: number | null
  weightedScore: number | null
  url: string
}

export default function LeaderboardTabs({ tabs, data }: { tabs: string[]; data: Record<string, ModelTop[]> }) {
  const [active, setActive] = useState(tabs[0])
  const rows = data[active] ?? []

  return (
    <div>
      <div className='flex flex-wrap gap-2 mb-4 border-b border-gray-800'>
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setActive(t)}
            className={`px-3 py-2 text-sm transition-colors -mb-px border-b-2 ${active === t ? 'border-blue-500 text-blue-400' : 'border-transparent text-gray-400 hover:text-gray-200'}`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className='overflow-x-auto rounded-lg border border-gray-800'>
        <table className='w-full text-sm'>
          <thead>
            <tr className='border-b border-gray-800 text-left text-gray-400 bg-gray-900/50'>
              <th className='py-3 px-4 font-medium w-12 text-center'>#</th>
              <th className='py-3 px-4 font-medium'>站点</th>
              <th className='py-3 px-4 font-medium'>渠道</th>
              <th className='py-3 px-4 font-medium text-right'>价格</th>
              <th className='py-3 px-4 font-medium text-right'>通过率</th>
              <th className='py-3 px-4 font-medium text-right'>在线率</th>
              <th className='py-3 px-4 font-medium text-right'>评分</th>
              <th className='py-3 px-4 font-medium'></th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={8} className='py-12 text-center text-gray-500'>暂无数据</td></tr>
            ) : rows.map((r, i) => (
              <tr key={r.id} className='border-b border-gray-800/50 hover:bg-gray-900/50 transition-colors'>
                <td className='py-3 px-4 text-center'>
                  <span className={`inline-flex items-center justify-center w-6 h-6 rounded text-xs tabular-nums ${i < 3 ? 'bg-yellow-900/40 text-yellow-300 font-semibold' : 'text-gray-500'}`}>{i + 1}</span>
                </td>
                <td className='py-3 px-4'>
                  <Link href={`/sites/${r.siteId}`} className='font-medium text-gray-100 hover:text-blue-400'>{r.siteName}</Link>
                </td>
                <td className='py-3 px-4 text-xs text-gray-400'>{r.channel}</td>
                <td className='py-3 px-4 text-right tabular-nums text-gray-100'>{r.price > 0 ? `¥${r.price.toFixed(r.price < 1 ? 4 : 2)}` : '-'}</td>
                <td className='py-3 px-4 text-right tabular-nums text-gray-300'>{r.passRate == null ? '-' : `${r.passRate.toFixed(1)}%`}</td>
                <td className='py-3 px-4 text-right tabular-nums text-gray-300'>{r.onlineRate == null ? '-' : `${r.onlineRate.toFixed(1)}%`}</td>
                <td className='py-3 px-4 text-right tabular-nums text-gray-100 font-medium'>{r.weightedScore == null ? '-' : r.weightedScore.toFixed(1)}</td>
                <td className='py-3 px-4'>
                  <a href={r.url} target='_blank' rel='noreferrer noopener' className='px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white text-xs transition-colors'>访问</a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
