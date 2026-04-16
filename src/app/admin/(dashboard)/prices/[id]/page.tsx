import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { updatePrice, deletePrice } from '../actions'
import ConfirmDelete from '@/app/admin/_components/ConfirmDelete'

export const dynamic = 'force-dynamic'

export default async function EditPricePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const priceId = Number(id)
  if (!Number.isFinite(priceId)) notFound()

  const p = await prisma.siteModelPrice.findUnique({
    where: { id: priceId },
    include: { site: { select: { name: true } } },
  })
  if (!p) notFound()

  return (
    <div className='max-w-2xl mx-auto space-y-5 pb-20'>
      <header>
        <a href='/admin/prices' className='text-sm text-stone-500 hover:text-brand-700'>
          ← 价格列表
        </a>
        <h1 className='text-2xl font-bold tracking-tight mt-1'>
          编辑价格：<span className='text-stone-700'>{p.site.name}</span>
        </h1>
        <p className='text-xs text-stone-400 mj-mono mt-1'>{p.modelName}</p>
      </header>

      <form action={updatePrice.bind(null, priceId)} className='mj-card p-5 sm:p-6 space-y-4'>
        <div className='grid sm:grid-cols-2 gap-x-5 gap-y-4'>
          <Field label='价格 (¥)'>
            <input name='price' type='number' step='any' defaultValue={p.price} className='mj-input' />
          </Field>
          <Field label='倍率'>
            <input name='multiplier' type='number' step='any' defaultValue={p.multiplier} className='mj-input' />
          </Field>
          <Field label='计价单位'>
            <select name='priceUnit' defaultValue={p.priceUnit} className='mj-select'>
              <option value='per_million_tokens'>每百万 token</option>
              <option value='per_thousand_tokens'>每千 token</option>
            </select>
          </Field>
          <Field label='售后保障'>
            <select name='afterSales' defaultValue={p.afterSales} className='mj-select'>
              <option value='none'>无</option>
              <option value='verify_once'>单次验证</option>
              <option value='days_30'>30 天</option>
              <option value='lifetime'>终身</option>
            </select>
          </Field>
          <Field label='检测到的真实模型' hint='掺水检测推断出的实际模型'>
            <input name='detectedModel' defaultValue={p.detectedModel ?? ''} className='mj-input' />
          </Field>
          <Field label='掺水档位'>
            <select name='fakeRateBand' defaultValue={p.fakeRateBand ?? ''} className='mj-select'>
              <option value=''>未探测</option>
              <option value='minimal'>极少</option>
              <option value='low'>少量</option>
              <option value='light'>轻度</option>
              <option value='severe'>严重</option>
            </select>
          </Field>
          <Field label='通过率 (%)'>
            <input name='passRate' type='number' step='any' defaultValue={p.passRate ?? ''} className='mj-input' />
          </Field>
          <Field label='在线率 (%)'>
            <input name='onlineRate' type='number' step='any' defaultValue={p.onlineRate ?? ''} className='mj-input' />
          </Field>
          <Field label='平均延迟 (ms)'>
            <input name='avgLatencyMs' type='number' defaultValue={p.avgLatencyMs ?? ''} className='mj-input' />
          </Field>
          <Field label='综合评分'>
            <input name='weightedScore' type='number' step='any' defaultValue={p.weightedScore ?? ''} className='mj-input' />
          </Field>
        </div>

        <div className='flex items-center gap-5 pt-2'>
          <label className='flex items-center gap-2 cursor-pointer'>
            <input type='checkbox' name='tampered' defaultChecked={p.tampered} className='h-4 w-4 rounded border-stone-300 text-brand-600' />
            <span className='text-sm text-stone-700'>标记为已掺水</span>
          </label>
          <label className='flex items-center gap-2 cursor-pointer'>
            <input type='checkbox' name='priceAnomaly' defaultChecked={p.priceAnomaly} className='h-4 w-4 rounded border-stone-300 text-brand-600' />
            <span className='text-sm text-stone-700'>价格异常</span>
          </label>
        </div>

        <div className='flex items-center justify-between border-t border-stone-100 pt-4'>
          <ConfirmDelete action={() => deletePrice(priceId)} message='确认删除该价格记录？' />
          <div className='flex gap-2'>
            <a href='/admin/prices' className='mj-btn-ghost'>取消</a>
            <button type='submit' className='mj-btn-primary'>保存</button>
          </div>
        </div>
      </form>
    </div>
  )
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className='mj-label'>{label}</label>
      {children}
      {hint && <p className='mj-field-hint'>{hint}</p>}
    </div>
  )
}
