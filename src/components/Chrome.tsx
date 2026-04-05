'use client'

import { usePathname } from 'next/navigation'
import Nav from './Nav'
import Footer from './Footer'

export default function Chrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const bare = pathname?.startsWith('/admin')

  if (bare) {
    return <>{children}</>
  }

  return (
    <>
      <Nav />
      <main className='flex-1'>{children}</main>
      <Footer />
    </>
  )
}
