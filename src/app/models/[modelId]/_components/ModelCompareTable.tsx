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
  minimal: { text: '极低', cls: 'border-brand-200 bg-brand-50 text-brand-700' },
  low: { text: '轻微', cls: 'border-sky-200 bg-sky-50 text-sky-700' },
  light: { text: '中等', cls: 'border-amber-200 bg-amber-50 text-amber-700' },
  severe: { text: '严重', cls: 'border-red-200 bg-red-50 text-red-600' },
}

const statusLabel: Record<string, { text: string; cls: string }> = {
  online: { text: '在线', cls: 'border-brand-200 bg-brand-50 text-brand-700' },
  unstable: { text: '不稳定', cls: 'border-amber-200 bg-amber-50 text-amber-700' },
  offline: { text: '离线', cls: 'border-red-200 bg-red-50 text-red-600' },
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
        <label className='flex items-center gap-1.5 text-stone-600'>
          <input type='checkbox' checked={freeOnly} onChange={(e) => setFreeOnly(e.target.checked)} className='accent-brand-600' />
          公益站
        </label>
        <label className='flex items-center gap-1.5 text-stone-600'>
          <input type='checkbox' checked={invoiceOnly} onChange={(e) => setInvoiceOnly(e.target.checked)} className='accent-brand-600' />
          支持发票
        </label>
        <span className='ml-auto text-stone-400 text-xs mj-mono'>{filtered.length} / {channels.length} 条</span>
      </div>

      <div className='mj-table-wrap'>
        <table className='mj-table'>
          <thead>
            <tr>
              <th className='mj-th'>站点</th>
              <th className='mj-th'>渠道</th>
              <th className='mj-th text-right cursor-pointer hover:text-stone-800' onClick={() => toggleSort('price')}>输入价{arrow('price')}</th>
              <th className='mj-th text-right text-stone-300'>输出价</th>
              <th className='mj-th text-right cursor-pointer hover:text-stone-800' onClick={() => toggleSort('passRate')}>通过率{arrow('passRate')}</th>
              <th className='mj-th text-right cursor-pointer hover:text-stone-800' onClick={() => toggleSort('onlineRate')}>在线率{arrow('onlineRate')}</th>
              <th className='mj-th text-right cursor-pointer hover:text-stone-800' onClick={() => toggleSort('avgLatencyMs')}>延迟{arrow('avgLatencyMs')}</th>
              <th className='mj-th'>掺水</th>
              <th className='mj-th text-right cursor-pointer hover:text-stone-800' onClick={() => toggleSort('weightedScore')}>综合分{arrow('weightedScore')}</th>
              <th className='mj-th'></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={10} className='py-12 text-center text-stone-400'>无匹配结果</td></tr>
            ) : filtered.map((c) => {
              const st = statusLabel[c.siteStatus] ?? statusLabel.online
              const bd = c.fakeRateBand ? bandLabel[c.fakeRateBand] : null
              return (
                <tr key={c.id} className='mj-row'>
                  <td className='mj-td'>
                    <div className='flex items-center gap-1.5 flex-wrap'>
                      <Link href={`/sites/${c.siteId}`} className='font-medium text-stone-900 hover:text-brand-700'>{c.siteName}</Link>
                      <span className={`mj-badge ${st.cls}`}>{st.text}</span>
                      {c.siteIsFree ? <span className='mj-badge border-brand-200 bg-brand-50 text-brand-700'>公益</span> : null}
                      {c.siteHasInvoice ? <span className='mj-badge border-sky-200 bg-sky-50 text-sky-700'>票</span> : null}
                    </div>
                  </td>
                  <td className='mj-td text-stone-400 text-xs'>{c.channel || 'default'}</td>
                  <td className='mj-td text-right'><PriceCell price={c.price} unit={c.priceUnit} multiplier={c.multiplier} /></td>
                  <td className='mj-td text-right text-stone-300'>-</td>
                  <td className='mj-td text-right'>
                    {c.passRate == null ? <span className='text-stone-300'>-</span> : <PassBar v={c.passRate} />}
                  </td>
                  <td className='mj-td text-right mj-mono text-stone-600'>{c.onlineRate == null ? '-' : `${c.onlineRate.toFixed(1)}%`}</td>
                  <td className='mj-td text-right mj-mono text-stone-600'>{c.avgLatencyMs == null ? '-' : `${c.avgLatencyMs}ms`}</td>
                  <td className='mj-td'>
                    {bd ? <span className={`mj-badge ${bd.cls}`}>{bd.text}</span> : <span className='text-stone-300 text-xs'>-</span>}
                  </td>
                  <td className='mj-td text-right mj-mono text-stone-900 font-medium'>{c.weightedScore == null ? '-' : c.weightedScore.toFixed(1)}</td>
                  <td className='mj-td'>
                    <a href={c.siteUrl} target='_blank' rel='noreferrer noopener' className='mj-btn-ghost px-2.5 py-1 text-xs'>访问</a>
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
    <label className='flex items-center gap-1.5 text-stone-600'>
      <span className='text-stone-400'>{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className='mj-select py-1'>
        {options.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}
      </select>
    </label>
  )
}

function PassBar({ v }: { v: number }) {
  const pct = Math.max(0, Math.min(100, v))
  const color = pct >= 90 ? 'bg-brand-500' : pct >= 70 ? 'bg-amber-500' : 'bg-red-500'
  return (
    <div className='inline-flex items-center gap-2'>
      <div className='w-16 h-1.5 rounded bg-stone-200 overflow-hidden'>
        <div className={`h-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className='mj-mono text-stone-600 text-xs'>{pct.toFixed(1)}%</span>
    </div>
  )
}
