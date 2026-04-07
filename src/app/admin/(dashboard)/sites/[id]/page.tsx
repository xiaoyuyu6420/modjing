import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import SiteForm, { type SiteFormValues } from '../_components/SiteForm'
import { updateSite } from '../actions'

export const dynamic = 'force-dynamic'

export default async function EditSitePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const siteId = Number(id)
  if (!Number.isFinite(siteId)) notFound()

  const site = await prisma.site.findUnique({ where: { id: siteId } })
  if (!site) notFound()

  return (
    <div className='max-w-3xl mx-auto space-y-5'>
      <header>
        <a href='/admin/sites' className='text-sm text-stone-500 hover:text-brand-700'>
          ← 站点列表
        </a>
        <h1 className='text-2xl font-bold tracking-tight mt-1'>
          编辑：<span className='text-stone-700'>{site.name}</span>
        </h1>
      </header>
      <SiteForm site={site as SiteFormValues} action={updateSite.bind(null, siteId)} />
    </div>
  )
}
