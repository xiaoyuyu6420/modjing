import SiteForm from '../_components/site-form'

export default function NewSite() {
  return (
    <div className='p-8 max-w-3xl'>
      <div className='mb-6'>
        <h1 className='text-2xl font-bold text-gray-100'>添加站点</h1>
        <p className='text-sm text-gray-500 mt-1'>录入新的中转站信息</p>
      </div>
      <SiteForm />
    </div>
  )
}
