'use client'

import { useMemo, useState } from 'react'

export type EnterpriseSite = {
  id: number
  name: string
  url: string
  hasInvoice: boolean
  invoiceTypes: string | null
  complianceLevel: string | null
  dataLocation: string | null
  slaUptime: number | null
  has24x7Support: boolean
  hasEnterpriseAccount: boolean
  avgOnline: number
  avgPass: number
  avgPrice: number
  channelCount: number
}

type Weights = {
  onlineRate: number
  compliance: number
  price: number
  sla: number
  stability: number
}

const DEFAULT_WEIGHTS: Weights = {
  onlineRate: 25,
  compliance: 25,
  price: 20,
  sla: 15,
  stability: 15,
}

function calcScore(s: EnterpriseSite, w: Weights): number {
  const normalizedPrice = 1 - Math.min(s.avgPrice / 50, 1)
  let base =
    (s.avgOnline * w.onlineRate) / 100 +
    (s.avgPass * w.stability) / 100 +
    (normalizedPrice * 100 * w.price) / 100 +
    ((s.slaUptime ?? 0) * w.sla) / 100
  let compBonus = 0
  if (s.hasInvoice) compBonus += 20
  if (s.complianceLevel === 'mlps3') compBonus += 30
  else if (s.complianceLevel === 'mlps2') compBonus += 20
  else if (s.complianceLevel === 'iso27001') compBonus += 15
  base += (compBonus * w.compliance) / 100
  return Math.min(Math.round(base), 100)
}

function complianceLabel(c: string | null): string {
  if (c === 'mlps3') return '等保三级'
  if (c === 'mlps2') return '等保二级'
  if (c === 'iso27001') return 'ISO27001'
  if (c === 'basic') return '基础'
  return '—'
}

export default function EnterpriseExplorer({ sites }: { sites: EnterpriseSite[] }) {
  const [invoice, setInvoice] = useState<string>('any')
  const [compliance, setCompliance] = useState<string>('any')
  const [dataLoc, setDataLoc] = useState<string>('any')
  const [sla, setSla] = useState<string>('any')
  const [support, setSupport] = useState<string>('any')
  const [enterprise, setEnterprise] = useState<string>('any')
  const [weights, setWeights] = useState<Weights>(DEFAULT_WEIGHTS)

  const filtered = useMemo(() => {
    return sites.filter((s) => {
      if (invoice === 'yes' && !s.hasInvoice) return false
      if (invoice === 'special' && !(s.invoiceTypes ?? '').includes('special')) return false
      if (invoice === 'normal' && !(s.invoiceTypes ?? '').includes('normal')) return false
      if (invoice === 'electronic' && !(s.invoiceTypes ?? '').includes('electronic')) return false
      if (compliance === 'mlps2' && s.complianceLevel !== 'mlps2' && s.complianceLevel !== 'mlps3')
        return false
      if (compliance === 'mlps3' && s.complianceLevel !== 'mlps3') return false
      if (compliance === 'iso27001' && s.complianceLevel !== 'iso27001') return false
      if (dataLoc !== 'any' && s.dataLocation !== dataLoc) return false
      if (sla === '99.9' && (s.slaUptime ?? 0) < 99.9) return false
      if (sla === '99.5' && (s.slaUptime ?? 0) < 99.5) return false
      if (sla === '99' && (s.slaUptime ?? 0) < 99) return false
      if (support === 'yes' && !s.has24x7Support) return false
      if (support === 'no' && s.has24x7Support) return false
      if (enterprise === 'yes' && !s.hasEnterpriseAccount) return false
      if (enterprise === 'no' && s.hasEnterpriseAccount) return false
      return true
    })
  }, [sites, invoice, compliance, dataLoc, sla, support, enterprise])

  const ranked = useMemo(() => {
    return filtered
      .map((s) => ({ ...s, score: calcScore(s, weights) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 100)
  }, [filtered, weights])

  return (
    <div>
      <section className='mb-6 rounded-lg border border-gray-800 bg-gray-900/60 p-5'>
        <h2 className='mb-4 text-sm font-semibold text-gray-300'>筛选条件</h2>
        <div className='grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6'>
          <Select label='发票' value={invoice} onChange={setInvoice}
            options={[['any', '任意'], ['yes', '有发票'], ['normal', '普票'], ['special', '专票'], ['electronic', '电子']]} />
          <Select label='等保' value={compliance} onChange={setCompliance}
            options={[['any', '任意'], ['mlps2', '≥ 等保二级'], ['mlps3', '等保三级'], ['iso27001', 'ISO27001']]} />
          <Select label='数据位置' value={dataLoc} onChange={setDataLoc}
            options={[['any', '任意'], ['CN', 'CN'], ['US', 'US'], ['EU', 'EU'], ['Mixed', '混合']]} />
          <Select label='SLA' value={sla} onChange={setSla}
            options={[['any', '任意'], ['99.9', '≥99.9%'], ['99.5', '≥99.5%'], ['99', '≥99%']]} />
          <Select label='7×24 客服' value={support} onChange={setSupport}
            options={[['any', '任意'], ['yes', '是'], ['no', '否']]} />
          <Select label='企业账户' value={enterprise} onChange={setEnterprise}
            options={[['any', '任意'], ['yes', '是'], ['no', '否']]} />
        </div>
      </section>

      <section className='mb-6 rounded-lg border border-blue-900/50 bg-blue-950/20 p-5'>
        <div className='mb-3 flex items-center justify-between'>
          <h2 className='text-sm font-semibold text-blue-200'>权重滑块（公开 + 可调）</h2>
          <button
            className='text-xs text-blue-300 hover:underline'
            onClick={() => setWeights(DEFAULT_WEIGHTS)}
          >
            重置默认
          </button>
        </div>
        <div className='grid grid-cols-1 gap-4 md:grid-cols-5'>
          <Slider label='在线率' value={weights.onlineRate} onChange={(v) => setWeights({ ...weights, onlineRate: v })} />
          <Slider label='合规分' value={weights.compliance} onChange={(v) => setWeights({ ...weights, compliance: v })} />
          <Slider label='价格' value={weights.price} onChange={(v) => setWeights({ ...weights, price: v })} />
          <Slider label='SLA' value={weights.sla} onChange={(v) => setWeights({ ...weights, sla: v })} />
          <Slider label='稳定性' value={weights.stability} onChange={(v) => setWeights({ ...weights, stability: v })} />
        </div>
      </section>

      <section className='overflow-x-auto rounded-lg border border-gray-800'>
        <table className='w-full text-sm'>
          <thead className='bg-gray-900/80 text-left text-xs text-gray-400'>
            <tr>
              <th className='p-3'>#</th>
              <th className='p-3'>站点</th>
              <th className='p-3'>发票</th>
              <th className='p-3'>等保</th>
              <th className='p-3'>数据位置</th>
              <th className='p-3'>SLA</th>
              <th className='p-3'>在线率</th>
              <th className='p-3'>平均价</th>
              <th className='p-3 text-right'>综合分</th>
            </tr>
          </thead>
          <tbody>
            {ranked.map((s, i) => (
              <tr key={s.id} className='border-t border-gray-800 hover:bg-gray-900/50'>
                <td className='p-3 text-gray-500'>{i + 1}</td>
                <td className='p-3'>
                  <a href={s.url} target='_blank' rel='noreferrer' className='font-medium text-gray-100 hover:text-blue-400'>
                    {s.name}
                  </a>
                  <div className='text-xs text-gray-500'>{s.channelCount} 个渠道</div>
                </td>
                <td className='p-3'>{s.hasInvoice ? <span className='text-green-400'>✓</span> : <span className='text-gray-600'>—</span>}</td>
                <td className='p-3'>{complianceLabel(s.complianceLevel)}</td>
                <td className='p-3'>{s.dataLocation ?? '—'}</td>
                <td className='p-3'>{s.slaUptime != null ? `${s.slaUptime}%` : '—'}</td>
                <td className='p-3'>{s.avgOnline > 0 ? `${s.avgOnline.toFixed(1)}%` : '—'}</td>
                <td className='p-3'>{s.avgPrice > 0 ? `¥${s.avgPrice.toFixed(2)}` : '—'}</td>
                <td className='p-3 text-right font-mono font-semibold text-blue-400'>{s.score}</td>
              </tr>
            ))}
            {ranked.length === 0 && (
              <tr>
                <td colSpan={9} className='p-8 text-center text-gray-500'>
                  没有符合条件的站点
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
      <p className='mt-3 text-xs text-gray-500'>共 {filtered.length} 个站点匹配，展示前 100。</p>
    </div>
  )
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: [string, string][]
}) {
  return (
    <label className='block text-xs text-gray-400'>
      <span className='mb-1 block'>{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className='w-full rounded border border-gray-700 bg-gray-950 px-2 py-1.5 text-sm text-gray-100 focus:border-blue-500 focus:outline-none'
      >
        {options.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
    </label>
  )
}

function Slider({
  label,
  value,
  onChange,
}: {
  label: string
  value: number
  onChange: (v: number) => void
}) {
  return (
    <label className='block text-xs text-gray-300'>
      <div className='mb-1 flex justify-between'>
        <span>{label}</span>
        <span className='font-mono text-blue-300'>{value}</span>
      </div>
      <input
        type='range'
        min={0}
        max={50}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className='w-full accent-blue-500'
      />
    </label>
  )
}
