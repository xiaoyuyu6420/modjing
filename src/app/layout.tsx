import type { Metadata } from 'next'
import './globals.css'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'

export const metadata: Metadata = {
  title: {
    default: '模镜 Miro · 中转站评测平台',
    template: '%s · 模镜 Miro',
  },
  description: '做裁判，不做运动员。消除大模型 API 服务的信息不对称——价格、健康度、掺水检测、企业合规，全部透明可复现。',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang='zh-CN'>
      <body className='min-h-screen flex flex-col antialiased bg-stone-50 text-stone-900 font-sans'>
        <Nav />
        <main className='flex-1'>{children}</main>
        <Footer />
      </body>
    </html>
  )
}
