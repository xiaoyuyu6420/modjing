import Link from 'next/link'
import { prisma } from '@/lib/prisma'

async function getStats() {
  const [siteCount, priceCount] = await Promise.all([
    prisma.site.count(),
    prisma.siteModelPrice.count(),
  ])
  return { siteCount, priceCount }
}

const FEATURES = [
  {
    title: '447 家中转站尽收眼底',
    desc: '全网覆盖最广的中转站数据库，含价格、健康度、合规字段、用户评价，每日更新。',
    cta: '浏览站点',
    href: '/sites',
  },
  {
    title: '方法论完全公开 · 权重可调',
    desc: '32 道探针 + 4 维指纹算法 + 5 项加权评分公式全部开源。企业用户可拖滑块自定义权重。',
    cta: '看方法论',
    href: '/methodology',
  },
  {
    title: '企业合规专区独家',
    desc: '发票、等保、数据本地化、合同模板、SLA 承诺 — 这些字段只有模镜在追踪。',
    cta: '进合规专区',
    href: '/enterprise',
  },
]

export default async function Home() {
  const { siteCount, priceCount } = await getStats()

  return (
    <div className='space-y-20'>
      <section className='relative px-4 pt-16 pb-12 text-center'>
        <div className='max-w-3xl mx-auto space-y-8'>
          <div className='space-y-3'>
            <h1 className='text-5xl sm:text-6xl font-bold tracking-tight'>
              模镜 <span className='text-gray-500'>· Miro</span>
            </h1>
            <p className='text-xl text-gray-300'>
              中转站评测平台 — <span className='text-blue-400'>做裁判</span>，不做运动员
            </p>
            <p className='text-sm text-gray-500 max-w-xl mx-auto'>
              消除大模型 API 服务的信息不对称。所有评分透明可复现，所有方法论公开可质疑。
            </p>
          </div>

          <form action='/sites' className='flex gap-2 max-w-lg mx-auto'>
            <input
              type='text'
              name='q'
              placeholder='搜站点名 / 模型 / 厂商...'
              className='flex-1 px-4 py-3 rounded-lg bg-gray-900 border border-gray-700 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500'
            />
            <button
              type='submit'
              className='px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium'
            >
              搜索
            </button>
          </form>

          <div className='flex flex-wrap gap-3 justify-center'>
            <Link
              href='/leaderboard'
              className='px-5 py-2.5 rounded-lg bg-gray-100 text-gray-900 font-medium hover:bg-white'
            >
              看排行榜
            </Link>
            <Link
              href='/enterprise'
              className='px-5 py-2.5 rounded-lg border border-gray-700 text-gray-100 hover:border-gray-500'
            >
              企业合规 →
            </Link>
            <Link
              href='/benchmark'
              className='px-5 py-2.5 rounded-lg border border-gray-700 text-gray-100 hover:border-gray-500'
            >
              测我的 Key →
            </Link>
          </div>
        </div>
      </section>

      <section className='max-w-6xl mx-auto px-4'>
        <div className='grid md:grid-cols-3 gap-5'>
          {FEATURES.map((f) => (
            <Link
              key={f.title}
              href={f.href}
              className='group bg-gray-900 border border-gray-800 rounded-lg p-6 hover:border-blue-700 transition-colors space-y-3'
            >
              <h3 className='text-lg font-bold text-gray-100'>{f.title}</h3>
              <p className='text-sm text-gray-400'>{f.desc}</p>
              <div className='text-sm text-blue-400 group-hover:text-blue-300'>{f.cta} →</div>
            </Link>
          ))}
        </div>
      </section>

      <section className='max-w-4xl mx-auto px-4'>
        <div className='grid grid-cols-3 gap-4 bg-gray-900 border border-gray-800 rounded-lg p-6 text-center'>
          <div>
            <div className='text-3xl font-bold text-blue-400'>{siteCount}</div>
            <div className='text-xs text-gray-500 mt-1'>已收录中转站</div>
          </div>
          <div>
            <div className='text-3xl font-bold text-green-400'>{priceCount}</div>
            <div className='text-xs text-gray-500 mt-1'>价格条目</div>
          </div>
          <div>
            <div className='text-3xl font-bold text-purple-400'>32</div>
            <div className='text-xs text-gray-500 mt-1'>道探针 prompt</div>
          </div>
        </div>
      </section>

      <section className='max-w-4xl mx-auto px-4 text-center space-y-4'>
        <h2 className='text-2xl font-bold'>为什么相信模镜</h2>
        <div className='grid sm:grid-cols-3 gap-4 text-sm text-gray-400'>
          <div className='bg-gray-900 border border-gray-800 rounded p-4'>
            <div className='text-gray-100 font-bold mb-1'>透明</div>
            探针 prompt、评分公式、权重默认值 — 全部公开在 /methodology
          </div>
          <div className='bg-gray-900 border border-gray-800 rounded p-4'>
            <div className='text-gray-100 font-bold mb-1'>中立</div>
            不卖 API、不收推广费、不接广告。收入来自企业咨询。
          </div>
          <div className='bg-gray-900 border border-gray-800 rounded p-4'>
            <div className='text-gray-100 font-bold mb-1'>可质疑</div>
            评分有异议？欢迎在 GitHub 提 issue / PR，我们公开讨论。
          </div>
        </div>
      </section>
    </div>
  )
}
