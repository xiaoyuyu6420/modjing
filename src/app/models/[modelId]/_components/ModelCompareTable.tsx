'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import PriceCell from '@/components/ui/PriceCell'

export type Channel = {
  id: number
  siteId: number
  siteName: string
  siteUrl: string
  siteStatus: string
  siteIsFree: boolean
  siteHasInvoice: boolean
  channel: string
  price: number
  multiplier: number
  priceUnit: string
  passRate: number | null
  onlineRate: number | null
  fakeRateBand: string | null
  avgLatencyMs: number | null
  weightedScore: number | null
  tampered: boolean
  priceAnomaly: boolean
}

type SortKey = 'price' | 'passRate' | 'avgLatencyMs' | 'weightedScore' | 'onlineRate'

const bandLabel: Record<string, { text: string; cls: string }> = {
  minimal: { text: '极低', cls: 'bg-green-900/50 text-green-400' },
  low: { text: '轻微', cls: 'bg-blue-900/50 text-blue-300' },
  light: { text: '中等', cls: 'bg-yellow-900/50 text-yellow-400' },
  severe: { text: '严重', cls: 'bg-red-900/50 text-red-400' },
}

const statusLabel: Record<string, { text: string; cls: string }> = {
  online: { text: '在线', cls: 'bg-green-900/50 text-green-400' },
  unstable: { text: '不稳定', cls: 'bg-yellow-900/50 text-yellow-400' },
  offline: { text: '离线', cls: 'bg-red-900/50 text-red-400' },
}

export default function ModelCompareTable({ channels }: { channels: Channel[] }) {
  const [status, setStatus] = useState<string>('all')
  const [band, setBand] = useState<string>('all')
  const [freeOnly, setFreeOnly] = useState(false)
  const [invoiceOnly, setInvoiceOnly] = useState(false)
  const [sortKey, setSortKey] = useState<SortKey>('weightedScore')
  const [asc, setAsc] = useState(false)

  const filtered = useMemo(() => {
    let xs = channels
    if (status !== 'all') xs = xs.filter((c) => c.siteStatus === status)
    if (band !== 'all') xs = xs.filter((c) => (band === 'none' ? !c.fakeRateBand : c.fakeRateBand === band))
    if (freeOnly) xs = xs.filter((c) => c.siteIsFree)
    if (invoiceOnly) xs = xs.filter((c) => c.siteHasInvoice)

    const sorted = [...xs].sort((a, b) => {
      const av = (sortKey === 'price' ? a.price * (a.multiplier || 1) : a[sortKey]) as number | null
      const bv = (sortKey === 'price' ? b.price * (b.multiplier || 1) : b[sortKey]) as number | null
      if (av == null && bv == null) return 0
      if (av == null) return 1
      if (bv == null) return -1
      return asc ? av - bv : bv - av
    })
    return sorted
  }, [channels, status, band, freeOnly, invoiceOnly, sortKey, asc])

  const toggleSort = (k: SortKey) => {
    if (sortKey === k) setAsc(!asc)
    else {
      setSortKey(k)
      setAsc(k === 'price' || k === 'avgLatencyMs')
    }
  }

  const arrow = (k: SortKey) => (sortKey === k ? (asc ? ' ↑' : ' ↓') : '')

  return (
    <div className='space-y-4'>
      <div className='flex flex-wrap items-center gap-3 text-sm'>
        <Select label='状态' value={status} onChange={setStatus} options={[
          { v: 'all', l: '全部' },
          { v: 'online', l: '在线' },
          { v: 'unstable', l: '不稳定' },
          { v: 'offline', l: '离线' },
        ]} />
        <Select label='掺水档' value={band} onChange={setBand} options={[
          { v: 'all', l: '全部' },
          { v: 'none', l: '未检测' },
          { v: 'minimal', l: '极低' },
          { v: 'low', l: '轻微' },
          { v: 'light', l: '中等' },
          { v: 'severe', l: '严重' },
        ]} />
        <label className='flex items-center gap-1.5 text-gray-300'>
          <input type='checkbox' checked={freeOnly} onChange={(e) => setFreeOnly(e.target.checked)} className='accent-blue-500' />
          公益站
        </label>
        <label className='flex items-center gap-1.5 text-gray-300'>
          <input type='checkbox' checked={invoiceOnly} onChange={(e) => setInvoiceOnly(e.target.checked)} className='accent-blue-500' />
          支持发票
        </label>
        <span className='ml-auto text-gray-500 text-xs'>{filtered.length} / {channels.length} 条</span>
      </div>

      <div className='overflow-x-auto rounded-lg border border-gray-800'>
        <table className='w-full text-sm'>
          <thead>
            <tr className='border-b border-gray-800 text-left text-gray-400 bg-gray-900/50'>
              <th className='py-3 px-4 font-medium'>站点</th>
              <th className='py-3 px-4 font-medium'>渠道</th>
              <th className='py-3 px-4 font-medium text-right cursor-pointer hover:text-gray-200' onClick={() => toggleSort('price')}>输入价{arrow('price')}</th>
              <th className='py-3 px-4 font-medium text-right text-gray-600'>输出价</th>
              <th className='py-3 px-4 font-medium text-right cursor-pointer hover:text-gray-200' onClick={() => toggleSort('passRate')}>通过率{arrow('passRate')}</th>
              <th className='py-3 px-4 font-medium text-right cursor-pointer hover:text-gray-200' onClick={() => toggleSort('onlineRate')}>在线率{arrow('onlineRate')}</th>
              <th className='py-3 px-4 font-medium text-right cursor-pointer hover:text-gray-200' onClick={() => toggleSort('avgLatencyMs')}>延迟{arrow('avgLatencyMs')}</th>
              <th className='py-3 px-4 font-medium'>掺水</th>
              <th className='py-3 px-4 font-medium text-right cursor-pointer hover:text-gray-200' onClick={() => toggleSort('weightedScore')}>综合分{arrow('weightedScore')}</th>
              <th className='py-3 px-4 font-medium'></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={10} className='py-12 text-center text-gray-500'>无匹配结果</td></tr>
            ) : filtered.map((c) => {
              const st = statusLabel[c.siteStatus] ?? statusLabel.online
              const bd = c.fakeRateBand ? bandLabel[c.fakeRateBand] : null
              return (
                <tr key={c.id} className='border-b border-gray-800/50 hover:bg-gray-900/50 transition-colors'>
                  <td className='py-3 px-4'>
                    <div className='flex items-center gap-2'>
                      <Link href={`/sites/${c.siteId}`} className='font-medium text-gray-100 hover:text-blue-400'>{c.siteName}</Link>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] ${st.cls}`}>{st.text}</span>
                      {c.siteIsFree ? <span className='px-1.5 py-0.5 rounded text-[10px] bg-emerald-900/40 text-emerald-300'>公益</span> : null}
                      {c.siteHasInvoice ? <span className='px-1.5 py-0.5 rounded text-[10px] bg-blue-900/40 text-blue-300'>票</span> : null}
                    </div>
                  </td>
                  <td className='py-3 px-4 text-gray-400 text-xs'>{c.channel || 'default'}</td>
                  <td className='py-3 px-4 text-right'><PriceCell price={c.price} unit={c.priceUnit} multiplier={c.multiplier} /></td>
                  <td className='py-3 px-4 text-right text-gray-600'>-</td>
                  <td className='py-3 px-4 text-right'>
                    {c.passRate == null ? <span className='text-gray-600'>-</span> : <PassBar v={c.passRate} />}
                  </td>
                  <td className='py-3 px-4 text-right tabular-nums text-gray-300'>{c.onlineRate == null ? '-' : `${c.onlineRate.toFixed(1)}%`}</td>
                  <td className='py-3 px-4 text-right tabular-nums text-gray-300'>{c.avgLatencyMs == null ? '-' : `${c.avgLatencyMs}ms`}</td>
                  <td className='py-3 px-4'>{bd ? <span className={`px-1.5 py-0.5 rounded text-[10px] ${bd.cls}`}>{bd.text}</span> : <span className='text-gray-600 text-xs'>-</span>}</td>
                  <td className='py-3 px-4 text-right tabular-nums text-gray-100 font-medium'>{c.weightedScore == null ? '-' : c.weightedScore.toFixed(1)}</td>
                  <td className='py-3 px-4'>
                    <a href={c.siteUrl} target='_blank' rel='noreferrer noopener' className='px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white text-xs transition-colors'>访问</a>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { v: string; l: string }[] }) {
  return (
    <label className='flex items-center gap-1.5 text-gray-300'>
      <span className='text-gray-500'>{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className='bg-gray-800 border border-gray-700 rounded px-2 py-1 text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500'>
        {options.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}
      </select>
    </label>
  )
}

function PassBar({ v }: { v: number }) {
  const pct = Math.max(0, Math.min(100, v))
  const color = pct >= 90 ? 'bg-green-500' : pct >= 70 ? 'bg-yellow-500' : 'bg-red-500'
  return (
    <div className='inline-flex items-center gap-2'>
      <div className='w-16 h-1.5 rounded bg-gray-800 overflow-hidden'>
        <div className={`h-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className='tabular-nums text-gray-300 text-xs'>{pct.toFixed(1)}%</span>
    </div>
  )
}
