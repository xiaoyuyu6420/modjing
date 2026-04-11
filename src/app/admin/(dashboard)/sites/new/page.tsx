import SiteForm from '../_components/SiteForm'
import { createSite } from '../actions'

export default function NewSitePage() {
  return (
    <div className='max-w-3xl mx-auto space-y-5'>
      <header className='flex items-center justify-between'>
        <div>
          <a href='/admin/sites' className='text-sm text-stone-500 hover:text-brand-700'>
            ← 站点列表
          </a>
          <h1 className='text-2xl font-bold tracking-tight mt-1'>新建站点</h1>
        </div>
      </header>
      <SiteForm action={createSite} />
    </div>
  )
}
