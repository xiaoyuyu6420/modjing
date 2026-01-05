import type { Metadata } from 'next'
import './globals.css'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'

export const metadata: Metadata = {
  title: '模镜 Miro - 中转站评测平台',
  description: '消除大模型 API 服务的信息不对称',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang='zh-CN' className='dark'>
      <body className='bg-gray-950 text-gray-100 min-h-screen antialiased flex flex-col'>
        <Nav />
        <main className='flex-1'>{children}</main>
        <Footer />
      </body>
    </html>
  )
}
