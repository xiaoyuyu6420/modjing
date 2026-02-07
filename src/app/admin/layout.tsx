import AdminSidebar from './_components/admin-sidebar'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className='flex min-h-[calc(100vh-3.5rem)]'>
      <AdminSidebar />
      <div className='flex-1 overflow-auto'>
        {children}
      </div>
    </div>
  )
}
