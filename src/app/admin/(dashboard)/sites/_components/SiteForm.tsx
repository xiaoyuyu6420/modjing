'use client'

import { useActionState } from 'react'

export type SiteFormValues = {
  name: string
  url: string
  logo: string | null
  description: string | null
  announcement: string | null
  isFree: boolean
  status: string
  paymentMethods: string
  hasInvoice: boolean
  invoiceTypes: string
  invoiceProvider: string | null
  complianceLevel: string | null
  complianceProof: string | null
  dataLocation: string | null
  dataRetention: string | null
  hasEnterpriseAccount: boolean
  hasSubAccounts: boolean
  slaUptime: number | null
  slaResponseTime: number | null
  has24x7Support: boolean
  hasContractTemplate: boolean
  contractProcess: string | null
  minContractAmount: number | null
}

type Props = {
  site?: SiteFormValues
  action: (fd: FormData) => Promise<void>
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className='mj-card p-5 sm:p-6'>
      <h2 className='text-sm font-semibold text-stone-900 mb-4'>{title}</h2>
      <div className='grid sm:grid-cols-2 gap-x-5 gap-y-4'>{children}</div>
    </section>
  )
}

function Text({
  label,
  name,
  defaultValue,
  placeholder,
  type = 'text',
  hint,
  full,
}: {
  label: string
  name: string
  defaultValue?: string | number | null
  placeholder?: string
  type?: string
  hint?: string
  full?: boolean
}) {
  return (
    <div className={full ? 'sm:col-span-2' : ''}>
      <label className='mj-label'>{label}</label>
      <input
        name={name}
        type={type}
        step={type === 'number' ? 'any' : undefined}
        defaultValue={defaultValue ?? ''}
        placeholder={placeholder}
        className='mj-input'
      />
      {hint && <p className='mj-field-hint'>{hint}</p>}
    </div>
  )
}

function Area({
  label,
  name,
  defaultValue,
  placeholder,
  hint,
}: {
  label: string
  name: string
  defaultValue?: string | null
  placeholder?: string
  hint?: string
}) {
  return (
    <div className='sm:col-span-2'>
      <label className='mj-label'>{label}</label>
      <textarea
        name={name}
        defaultValue={defaultValue ?? ''}
        placeholder={placeholder}
        rows={3}
        className='mj-input resize-y'
      />
      {hint && <p className='mj-field-hint'>{hint}</p>}
    </div>
  )
}

function Select({
  label,
  name,
  defaultValue,
  options,
  hint,
}: {
  label: string
  name: string
  defaultValue?: string | null
  options: { v: string; l: string }[]
  hint?: string
}) {
  return (
    <div>
      <label className='mj-label'>{label}</label>
      <select name={name} defaultValue={defaultValue ?? ''} className='mj-select'>
        {options.map((o) => (
          <option key={o.v} value={o.v}>
            {o.l}
          </option>
        ))}
      </select>
      {hint && <p className='mj-field-hint'>{hint}</p>}
    </div>
  )
}

function Check({
  label,
  name,
  defaultChecked,
}: {
  label: string
  name: string
  defaultChecked?: boolean
}) {
  return (
    <label className='flex items-center gap-2.5 cursor-pointer select-none py-1.5'>
      <input
        type='checkbox'
        name={name}
        defaultChecked={defaultChecked}
        className='h-4 w-4 rounded border-stone-300 text-brand-600 focus:ring-brand-500'
      />
      <span className='text-sm text-stone-700'>{label}</span>
    </label>
  )
}

export default function SiteForm({ site, action }: Props) {
  const [, formAction] = useActionState(async (_p: void, fd: FormData) => {
    await action(fd)
  }, undefined)

  return (
    <form action={formAction} className='space-y-5 pb-24'>
      <Section title='基础信息'>
        <Text label='站点名称' name='name' defaultValue={site?.name} placeholder='如 PackyCode' />
        <Text label='站点 URL' name='url' defaultValue={site?.url} placeholder='https://' />
        <Text label='Logo URL' name='logo' defaultValue={site?.logo} placeholder='https://.../logo.png' />
        <Select
          label='运行状态'
          name='status'
          defaultValue={site?.status ?? 'online'}
          options={[
            { v: 'online', l: '在线' },
            { v: 'unstable', l: '不稳定' },
            { v: 'offline', l: '离线' },
          ]}
        />
        <Area label='站点介绍' name='description' defaultValue={site?.description} placeholder='一句话描述这个中转站...' />
        <Area label='置顶公告' name='announcement' defaultValue={site?.announcement} placeholder='官方公告内容（选填）' />
      </Section>

      <Section title='商业属性'>
        <Check label='公益站（免费）' name='isFree' defaultChecked={site?.isFree} />
        <Check label='支持发票' name='hasInvoice' defaultChecked={site?.hasInvoice} />
        <Text
          label='支付方式'
          name='paymentMethods'
          defaultValue={site?.paymentMethods}
          placeholder='支付宝,微信,USDT,Stripe,Invoice'
          full
          hint='逗号分隔'
        />
      </Section>

      <Section title='企业合规'>
        <Text label='发票类型' name='invoiceTypes' defaultValue={site?.invoiceTypes} placeholder='增值税普票,专票,电子发票' />
        <Text label='开票主体' name='invoiceProvider' defaultValue={site?.invoiceProvider} />
        <Select
          label='合规等级'
          name='complianceLevel'
          defaultValue={site?.complianceLevel ?? 'none'}
          options={[
            { v: 'none', l: '无' },
            { v: 'basic', l: '基础' },
            { v: 'iso27001', l: 'ISO 27001' },
            { v: 'mlps2', l: '等保二级' },
            { v: 'mlps3', l: '等保三级' },
          ]}
        />
        <Text label='认证证书 URL' name='complianceProof' defaultValue={site?.complianceProof} />
        <Select
          label='数据所在地'
          name='dataLocation'
          defaultValue={site?.dataLocation ?? ''}
          options={[
            { v: '', l: '未标注' },
            { v: 'CN', l: '中国大陆' },
            { v: 'US', l: '美国' },
            { v: 'EU', l: '欧盟' },
            { v: 'Mixed', l: '混合部署' },
          ]}
        />
        <Text label='数据留存策略' name='dataRetention' defaultValue={site?.dataRetention} />
        <Text label='承诺 SLA 在线率 (%)' name='slaUptime' type='number' defaultValue={site?.slaUptime} placeholder='99.9' />
        <Text label='故障响应时间 (分钟)' name='slaResponseTime' type='number' defaultValue={site?.slaResponseTime} placeholder='30' />
        <Text label='最低合同金额 (¥)' name='minContractAmount' type='number' defaultValue={site?.minContractAmount} placeholder='10000' />
        <div className='sm:col-span-2 grid sm:grid-cols-2 gap-x-5'>
          <Check label='企业账户' name='hasEnterpriseAccount' defaultChecked={site?.hasEnterpriseAccount} />
          <Check label='子账号' name='hasSubAccounts' defaultChecked={site?.hasSubAccounts} />
          <Check label='7×24 支持' name='has24x7Support' defaultChecked={site?.has24x7Support} />
          <Check label='合同模板' name='hasContractTemplate' defaultChecked={site?.hasContractTemplate} />
        </div>
        <Area label='合同签署流程' name='contractProcess' defaultValue={site?.contractProcess} placeholder='描述合同签署流程...' />
      </Section>

      <div className='sticky bottom-0 -mx-4 sm:-mx-6 px-4 sm:px-6 py-3 bg-white/90 backdrop-blur border-t border-stone-200 flex items-center gap-3'>
        <button type='submit' className='mj-btn-primary'>
          保存
        </button>
        <a href='/admin/sites' className='mj-btn-ghost'>
          取消
        </a>
      </div>
    </form>
  )
}
