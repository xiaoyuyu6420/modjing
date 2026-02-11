import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import SiteForm from '../../_components/site-form'

export default async function EditSite({
  params,
}: {
  params: Promise<{ siteId: string }>
}) {
  const { siteId } = await params
  const site = await prisma.site.findUnique({ where: { id: parseInt(siteId) } })
  if (!site) notFound()

  return (
    <div className='p-8 max-w-3xl'>
      <div className='mb-6'>
        <h1 className='text-2xl font-bold text-gray-100'>编辑站点</h1>
        <p className='text-sm text-gray-500 mt-1'>{site.name}</p>
      </div>
      <SiteForm site={site} />
    </div>
  )
}
