import { prisma } from '@/lib/prisma'
import EnterpriseExplorer, { type EnterpriseSite } from './_components/enterprise-explorer'

export const metadata = {
  title: '企业合规 API 中转站排行 - 模镜',
  description: '按发票、等保、数据位置、SLA 等企业级合规维度筛选 API 中转站，权重可调。',
}

export const dynamic = 'force-dynamic'

async function loadSites(): Promise<EnterpriseSite[]> {
  const sites = await prisma.site.findMany({
    where: { status: { not: 'closed' } },
    include: {
      modelPrices: {
        select: { price: true, onlineRate: true, passRate: true },
      },
    },
  })
  return sites.map((s) => {
    const channels = s.modelPrices
    const onlineVals = channels.map((c) => c.onlineRate ?? 0).filter((v) => v > 0)
    const passVals = channels.map((c) => c.passRate ?? 0).filter((v) => v > 0)
    const priceVals = channels.map((c) => c.price ?? 0).filter((v) => v > 0)
    const avg = (a: number[]) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0)
    return {
      id: s.id,
      name: s.name,
      url: s.url,
      hasInvoice: s.hasInvoice,
      invoiceTypes: s.invoiceTypes,
      complianceLevel: s.complianceLevel,
      dataLocation: s.dataLocation,
      slaUptime: s.slaUptime,
      has24x7Support: s.has24x7Support,
      hasEnterpriseAccount: s.hasEnterpriseAccount,
      avgOnline: avg(onlineVals),
      avgPass: avg(passVals),
      avgPrice: avg(priceVals),
      channelCount: channels.length,
    }
  })
}

export default async function EnterprisePage() {
  const sites = await loadSites()
  return (
    <main className='min-h-screen bg-stone-50 text-stone-900'>
      <div className='mx-auto max-w-7xl px-6 py-10'>
        <header className='mb-6'>
          <h1 className='text-3xl font-bold'>企业合规 API 中转站排行</h1>
          <p className='mt-2 text-sm text-stone-500'>
            按发票资质、等保级别、数据位置、SLA 承诺等企业级维度筛选；权重公开、可调。
          </p>
        </header>
        <div className='mb-6 rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800'>
          ✦ 企业合规字段开放站长申报中，目前数据为初始状态——本页排序以现有探针数据为主，
          合规字段补齐后排序差异会更明显。
        </div>
        <EnterpriseExplorer sites={sites} />
        <footer className='mt-10 border-t border-stone-200 pt-4 text-xs text-stone-400'>
          打分公式与权重默认值见{' '}
          <a className='text-brand-600 hover:underline' href='/methodology'>
            /methodology 方法论
          </a>
          。
        </footer>
      </div>
    </main>
  )
}
