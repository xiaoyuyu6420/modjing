import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { FakeBandTag } from '@/components/ui/FakeBandTag'
import PriceFlagToggle from './_components/PriceControls'

export const dynamic = 'force-dynamic'

const PAGE_SIZE = 30

export default async function AdminPricesPage({
  searchParams,
}: {
  searchParams: Promise<{ site?: string; q?: string; band?: string; tampered?: string; page?: string }>
}) {
  const sp = await searchParams
  const siteId = sp.site ? Number(sp.site) : NaN
  const q = String(sp.q ?? '').trim()
  const band = String(sp.band ?? 'all')
  const tamperedOnly = sp.tampered === '1'
  const page = Math.max(1, Number(sp.page ?? 1) || 1)

  const where = {
    ...(Number.isFinite(siteId) ? { siteId } : {}),
    ...(q ? { modelName: { contains: q } } : {}),
    ...(band !== 'all' ? { fakeRateBand: band } : {}),
    ...(tamperedOnly ? { tampered: true } : {}),
  }

  const [total, rows, sites] = await Promise.all([
    prisma.siteModelPrice.count({ where }),
    prisma.siteModelPrice.findMany({
      where,
      orderBy: { id: 'desc' },
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
      include: { site: { select: { name: true } } },
    }),
    prisma.site.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } }),
  ])

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <div className='space-y-5'>
      <div>
        <h1 className='text-2xl font-bold tracking-tight'>模型价格</h1>
        <p className='text-sm text-stone-500 mt-1'>共 {total} 条价格记录</p>
      </div>

      <form className='flex flex-wrap items-center gap-2'>
        <select name='site' defaultValue={Number.isFinite(siteId) ? String(siteId) : ''} className='mj-select max-w-[180px]'>
          <option value=''>全部站点</option>
          {sites.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <input name='q' defaultValue={q} placeholder='模型名' className='mj-input max-w-[180px]' />
        <select name='band' defaultValue={band} className='mj-select'>
          <option value='all'>全部掺水档</option>
          <option value='minimal'>极少</option>
          <option value='low'>少量</option>
          <option value='light'>轻度</option>
          <option value='severe'>严重</option>
        </select>
        <label className='flex items-center gap-1.5 text-sm text-stone-600'>
          <input type='checkbox' name='tampered' value='1' defaultChecked={tamperedOnly} className='accent-brand-600' />
          仅掺水
        </label>
        <button type='submit' className='mj-btn-ghost'>
          筛选
        </button>
      </form>

      <div className='mj-table-wrap'>
        <table className='mj-table'>
          <thead>
            <tr>
              <th className='mj-th'>站点 / 模型</th>
              <th className='mj-th text-right'>输入价</th>
              <th className='mj-th text-right'>输出价</th>
              <th className='mj-th text-right'>倍率</th>
              <th className='mj-th text-right'>通过率</th>
              <th className='mj-th text-right'>在线率</th>
              <th className='mj-th text-right'>延迟</th>
              <th className='mj-th'>掺水档</th>
              <th className='mj-th text-center'>掺水</th>
              <th className='mj-th text-center'>异常</th>
              <th className='mj-th text-right'>操作</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={11} className='py-12 text-center text-stone-400'>
                  没有匹配的价格记录
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className='mj-row'>
                  <td className='mj-td'>
                    <div className='font-medium text-stone-900'>{r.site.name}</div>
                    <div className='text-xs text-stone-400 mj-mono'>{r.modelName}</div>
                  </td>
                  <td className='mj-td text-right mj-mono text-stone-900'>¥{r.price.toFixed(2)}</td>
                  <td className='mj-td text-right mj-mono text-stone-600'>
                    {r.priceOutput == null ? '-' : `¥${r.priceOutput.toFixed(2)}`}
                  </td>
                  <td className='mj-td text-right mj-mono text-stone-500'>{r.multiplier.toFixed(2)}x</td>
                  <td className='mj-td text-right mj-mono text-stone-600'>
                    {r.passRate == null ? '-' : `${r.passRate.toFixed(1)}%`}
                  </td>
                  <td className='mj-td text-right mj-mono text-stone-600'>
                    {r.onlineRate == null ? '-' : `${r.onlineRate.toFixed(1)}%`}
                  </td>
                  <td className='mj-td text-right mj-mono text-stone-600'>
                    {r.avgLatencyMs == null ? '-' : `${r.avgLatencyMs}ms`}
                  </td>
                  <td className='mj-td'>
                    <FakeBandTag band={r.fakeRateBand} />
                  </td>
                  <td className='mj-td text-center'>
                    <PriceFlagToggle
                      id={r.id}
                      field='tampered'
                      checked={r.tampered}
                      labelOn='已掺水'
                      labelOff='未掺水'
                    />
                  </td>
                  <td className='mj-td text-center'>
                    <PriceFlagToggle
                      id={r.id}
                      field='priceAnomaly'
                      checked={r.priceAnomaly}
                      labelOn='异常'
                      labelOff='正常'
                    />
                  </td>
                  <td className='mj-td text-right'>
                    <Link href={`/admin/prices/${r.id}`} className='text-xs text-brand-600 hover:text-brand-700'>
                      编辑
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <div className='flex items-center justify-center gap-2 text-sm text-stone-500 mj-mono'>
          第 {page} / {pages} 页
        </div>
      )}
    </div>
  )
}
