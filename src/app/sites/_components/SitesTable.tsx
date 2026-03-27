'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { StatusBadge } from '@/components/ui/StatusBadge'

export type SiteRow = {
  id: number
  name: string
  url: string
  status: string
  isFree: boolean
  hasInvoice: boolean
  complianceLevel: string | null
  modelCount: number
  anomalyCount: number
  avgScore: number | null
  createdAt: string
}

type SortKey = 'score-desc' | 'score-asc' | 'models-desc' | 'price-asc' | 'created-desc'

const COMPLIANCE_LABELS: Record<string, string> = {
  none: '无',
  basic: '基础',
  iso27001: 'ISO27001',
  mlps2: '等保二级',
  mlps3: '等保三级',
}

const PAGE_SIZE = 50

export function SitesTable({ rows }: { rows: SiteRow[] }) {
  const [q, setQ] = useState('')
  const [sort, setSort] = useState<SortKey>('score-desc')
  const [page, setPage] = useState(1)
  const [freeOnly, setFreeOnly] = useState(false)

  const filtered = useMemo(() => {
    const kw = q.trim().toLowerCase()
    let list = rows
    if (kw) {
      list = list.filter(
        (r) => r.name.toLowerCase().includes(kw) || r.url.toLowerCase().includes(kw),
      )
    }
    if (freeOnly) list = list.filter((r) => r.isFree)
    const sorted = [...list]
    switch (sort) {
      case 'score-desc':
        sorted.sort((a, b) => (b.avgScore ?? -1) - (a.avgScore ?? -1))
        break
      case 'score-asc':
        sorted.sort((a, b) => (a.avgScore ?? 999) - (b.avgScore ?? 999))
        break
      case 'models-desc':
        sorted.sort((a, b) => b.modelCount - a.modelCount)
        break
      case 'price-asc':
        sorted.sort((a, b) => b.modelCount - a.modelCount)
        break
      case 'created-desc':
        sorted.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
        break
    }
    return sorted
  }, [rows, q, sort, freeOnly])

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, pageCount)
  const slice = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  return (
    <div>
      <div className='mb-4 flex flex-wrap items-center gap-3'>
        <input
          type='text'
          value={q}
          onChange={(e) => {
            setQ(e.target.value)
            setPage(1)
          }}
          placeholder='搜索站点名 / 域名'
          className='mj-input flex-1 min-w-[220px]'
        />
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          className='mj-select'
        >
          <option value='score-desc'>综合评分 高→低</option>
          <option value='score-asc'>综合评分 低→高</option>
          <option value='models-desc'>模型数 多→少</option>
          <option value='price-asc'>价格 低→高</option>
          <option value='created-desc'>收录时间 新→旧</option>
        </select>
        <label className='text-sm text-stone-600 flex items-center gap-2 cursor-pointer'>
          <input
            type='checkbox'
            checked={freeOnly}
            onChange={(e) => {
              setFreeOnly(e.target.checked)
              setPage(1)
            }}
            className='accent-brand-600'
          />
          仅看公益站
        </label>
        <span className='text-xs text-stone-400'>共 {filtered.length} 条</span>
      </div>

      <div className='mj-table-wrap'>
        <table className='mj-table'>
          <thead>
            <tr>
              <th className='mj-th'>站点</th>
              <th className='mj-th'>状态</th>
              <th className='mj-th'>综合评分</th>
              <th className='mj-th'>模型数</th>
              <th className='mj-th'>价格异常</th>
              <th className='mj-th'>企业合规</th>
              <th className='mj-th'>类型</th>
              <th className='mj-th'>收录</th>
            </tr>
          </thead>
          <tbody>
            {slice.length === 0 ? (
              <tr>
                <td colSpan={8} className='py-12 text-center text-stone-400'>
                  没有匹配的站点
                </td>
              </tr>
            ) : (
              slice.map((r) => (
                <tr key={r.id} className='mj-row'>
                  <td className='mj-td'>
                    <Link
                      href={`/sites/${r.id}`}
                      className='font-medium text-stone-900 hover:text-brand-700'
                    >
                      {r.name}
                    </Link>
                    <a
                      href={r.url}
                      target='_blank'
                      rel='noreferrer'
                      className='ml-2 text-xs text-stone-400 hover:text-stone-600'
                    >
                      {stripUrl(r.url)} ↗
                    </a>
                  </td>
                  <td className='mj-td'>
                    <StatusBadge status={r.status} />
                  </td>
                  <td className='mj-td'>
                    {r.avgScore == null ? (
                      <span className='text-stone-300'>-</span>
                    ) : (
                      <span className='mj-mono text-brand-600'>
                        {r.avgScore.toFixed(1)}
                      </span>
                    )}
                  </td>
                  <td className='mj-td mj-mono text-stone-700'>{r.modelCount}</td>
                  <td className='mj-td'>
                    {r.anomalyCount > 0 ? (
                      <span className='text-red-600 text-xs font-medium'>{r.anomalyCount}</span>
                    ) : (
                      <span className='text-stone-300 text-xs'>-</span>
                    )}
                  </td>
                  <td className='mj-td'>
                    <div className='flex flex-wrap gap-1'>
                      {r.hasInvoice && (
                        <span className='mj-badge border-sky-200 bg-sky-50 text-sky-700'>票</span>
                      )}
                      {r.complianceLevel && r.complianceLevel !== 'none' && (
                        <span className='mj-badge border-violet-200 bg-violet-50 text-violet-700'>
                          {COMPLIANCE_LABELS[r.complianceLevel] ?? r.complianceLevel}
                        </span>
                      )}
                      {!r.hasInvoice && (!r.complianceLevel || r.complianceLevel === 'none') && (
                        <span className='text-stone-300 text-xs'>-</span>
                      )}
                    </div>
                  </td>
                  <td className='mj-td'>
                    {r.isFree ? (
                      <span className='text-brand-600 text-xs font-medium'>公益</span>
                    ) : (
                      <span className='text-stone-400 text-xs'>商用</span>
                    )}
                  </td>
                  <td className='mj-td text-stone-400 text-xs'>
                    {new Date(r.createdAt).toLocaleDateString('zh-CN')}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pageCount > 1 && (
        <div className='mt-4 flex items-center justify-center gap-2 text-sm'>
          <button
            onClick={() => setPage(Math.max(1, safePage - 1))}
            disabled={safePage === 1}
            className='px-3 py-1.5 border border-stone-300 rounded-lg bg-white text-stone-600 hover:bg-stone-50 disabled:opacity-40'
          >
            上一页
          </button>
          <span className='text-stone-500 mj-mono'>
            {safePage} / {pageCount}
          </span>
          <button
            onClick={() => setPage(Math.min(pageCount, safePage + 1))}
            disabled={safePage === pageCount}
            className='px-3 py-1.5 border border-stone-300 rounded-lg bg-white text-stone-600 hover:bg-stone-50 disabled:opacity-40'
          >
            下一页
          </button>
        </div>
      )}
    </div>
  )
}

function stripUrl(url: string) {
  try {
    return new URL(url).host
  } catch {
    return url
  }
}
