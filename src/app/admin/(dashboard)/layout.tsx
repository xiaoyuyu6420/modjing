import { requireAdmin } from '@/lib/admin-auth'
import AdminNav from '@/app/admin/_components/AdminSidebar'

export const dynamic = 'force-dynamic'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { enabled } = await requireAdmin()

  return (
    <div className='min-h-screen md:flex bg-stone-50'>
      <AdminNav />
      <div className='flex-1 min-w-0 flex flex-col'>
        {!enabled && (
          <div className='bg-amber-50 border-b border-amber-200 px-4 py-2 text-xs text-amber-800'>
            ⚠ 开发开放模式：未配置 <code className='font-mono'>ADMIN_PASSWORD</code>，任何人都可访问后台。生产部署请设置该环境变量。
          </div>
        )}
        <div className='flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto'>{children}</div>
      </div>
    </div>
  )
}
