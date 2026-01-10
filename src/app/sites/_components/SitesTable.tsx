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
          className='flex-1 min-w-[220px] bg-gray-900 border border-gray-800 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-600'
        />
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          className='bg-gray-900 border border-gray-800 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-600'
        >
          <option value='score-desc'>综合评分 高→低</option>
          <option value='score-asc'>综合评分 低→高</option>
          <option value='models-desc'>模型数 多→少</option>
          <option value='price-asc'>价格 低→高</option>
          <option value='created-desc'>收录时间 新→旧</option>
        </select>
        <label className='text-sm text-gray-400 flex items-center gap-2 cursor-pointer'>
          <input
            type='checkbox'
            checked={freeOnly}
            onChange={(e) => {
              setFreeOnly(e.target.checked)
              setPage(1)
            }}
          />
          仅看公益站
        </label>
        <span className='text-xs text-gray-500'>共 {filtered.length} 条</span>
      </div>

      <div className='overflow-x-auto border border-gray-800 rounded-lg'>
        <table className='w-full text-sm'>
          <thead className='bg-gray-900/60'>
            <tr className='text-left text-gray-400'>
              <th className='py-3 px-4 font-medium'>站点</th>
              <th className='py-3 px-4 font-medium'>状态</th>
              <th className='py-3 px-4 font-medium'>综合评分</th>
              <th className='py-3 px-4 font-medium'>模型数</th>
              <th className='py-3 px-4 font-medium'>价格异常</th>
              <th className='py-3 px-4 font-medium'>企业合规</th>
              <th className='py-3 px-4 font-medium'>类型</th>
              <th className='py-3 px-4 font-medium'>收录</th>
            </tr>
          </thead>
          <tbody>
            {slice.length === 0 ? (
              <tr>
                <td colSpan={8} className='py-12 text-center text-gray-500'>
                  没有匹配的站点
                </td>
              </tr>
            ) : (
              slice.map((r) => (
                <tr
                  key={r.id}
                  className='border-t border-gray-800/60 hover:bg-gray-900/50 transition-colors'
                >
                  <td className='py-3 px-4'>
                    <Link
                      href={`/sites/${r.id}`}
                      className='font-medium text-gray-100 hover:text-blue-400'
                    >
                      {r.name}
                    </Link>
                    <a
                      href={r.url}
                      target='_blank'
                      rel='noreferrer'
                      className='ml-2 text-xs text-gray-500 hover:text-gray-300'
                    >
                      {stripUrl(r.url)} ↗
                    </a>
                  </td>
                  <td className='py-3 px-4'>
                    <StatusBadge status={r.status} />
                  </td>
                  <td className='py-3 px-4'>
                    {r.avgScore == null ? (
                      <span className='text-gray-600'>-</span>
                    ) : (
                      <span className='font-mono text-blue-400'>
                        {r.avgScore.toFixed(1)}
                      </span>
                    )}
                  </td>
                  <td className='py-3 px-4 text-gray-300'>{r.modelCount}</td>
                  <td className='py-3 px-4'>
                    {r.anomalyCount > 0 ? (
                      <span className='text-red-400 text-xs'>{r.anomalyCount}</span>
                    ) : (
                      <span className='text-gray-600 text-xs'>-</span>
                    )}
                  </td>
                  <td className='py-3 px-4'>
                    <div className='flex flex-wrap gap-1'>
                      {r.hasInvoice && (
                        <span className='inline-block px-1.5 py-0.5 rounded text-[10px] border border-blue-800/50 text-blue-300 bg-blue-900/30'>
                          票
                        </span>
                      )}
                      {r.complianceLevel && r.complianceLevel !== 'none' && (
                        <span className='inline-block px-1.5 py-0.5 rounded text-[10px] border border-purple-800/50 text-purple-300 bg-purple-900/30'>
                          {COMPLIANCE_LABELS[r.complianceLevel] ?? r.complianceLevel}
                        </span>
                      )}
                      {!r.hasInvoice && (!r.complianceLevel || r.complianceLevel === 'none') && (
                        <span className='text-gray-600 text-xs'>-</span>
                      )}
                    </div>
                  </td>
                  <td className='py-3 px-4'>
                    {r.isFree ? (
                      <span className='text-green-400 text-xs'>公益</span>
                    ) : (
                      <span className='text-gray-500 text-xs'>商用</span>
                    )}
                  </td>
                  <td className='py-3 px-4 text-gray-500 text-xs'>
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
            className='px-3 py-1 border border-gray-800 rounded hover:bg-gray-900 disabled:opacity-40'
          >
            上一页
          </button>
          <span className='text-gray-400'>
            {safePage} / {pageCount}
          </span>
          <button
            onClick={() => setPage(Math.min(pageCount, safePage + 1))}
            disabled={safePage === pageCount}
            className='px-3 py-1 border border-gray-800 rounded hover:bg-gray-900 disabled:opacity-40'
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
