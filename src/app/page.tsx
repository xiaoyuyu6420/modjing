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
    <div className='space-y-24'>
      {/* hero */}
      <section className='relative overflow-hidden'>
        <div
          aria-hidden
          className='pointer-events-none absolute inset-x-0 -top-32 h-[420px] bg-[radial-gradient(60%_60%_at_50%_0%,rgba(16,185,129,0.16),transparent_70%)]'
        />
        <div className='relative max-w-3xl mx-auto px-4 pt-24 pb-16 text-center space-y-7'>
          <div className='inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700'>
            <span className='h-1.5 w-1.5 rounded-full bg-brand-500' />
            模镜 Miro · 中转站评测平台
          </div>

          <h1 className='text-5xl sm:text-6xl font-bold tracking-tight text-stone-900 leading-[1.05]'>
            做裁判，
            <span className='text-brand-600'>不做运动员</span>
          </h1>

          <p className='text-lg text-stone-500 max-w-xl mx-auto leading-relaxed'>
            消除大模型 API 服务的信息不对称。价格、健康度、掺水检测、企业合规 ——
            全部透明可复现。
          </p>

          <form action='/sites' className='flex gap-2 max-w-lg mx-auto pt-1'>
            <input
              type='text'
              name='q'
              placeholder='搜站点名 / 模型 / 厂商...'
              className='mj-input flex-1'
            />
            <button type='submit' className='mj-btn-primary px-6'>
              搜索
            </button>
          </form>

          <div className='flex flex-wrap gap-2.5 justify-center pt-1'>
            <Link href='/leaderboard' className='mj-btn-primary'>
              看排行榜
            </Link>
            <Link href='/enterprise' className='mj-btn-ghost'>
              企业合规 →
            </Link>
            <Link href='/benchmark' className='mj-btn-ghost'>
              测我的 Key →
            </Link>
          </div>
        </div>
      </section>

      {/* features */}
      <section className='max-w-6xl mx-auto px-4'>
        <div className='grid md:grid-cols-3 gap-5'>
          {FEATURES.map((f) => (
            <Link
              key={f.title}
              href={f.href}
              className='group mj-card mj-card-hover p-6 space-y-3'
            >
              <h3 className='text-lg font-bold text-stone-900'>{f.title}</h3>
              <p className='text-sm text-stone-500 leading-relaxed'>{f.desc}</p>
              <div className='text-sm text-brand-600 group-hover:text-brand-700'>
                {f.cta} →
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* stats */}
      <section className='max-w-4xl mx-auto px-4'>
        <div className='grid grid-cols-3 gap-px bg-stone-200 rounded-xl overflow-hidden border border-stone-200'>
          <Stat value={siteCount} label='已收录中转站' className='text-brand-600' />
          <Stat value={priceCount} label='价格条目' className='text-stone-900' />
          <Stat value={32} label='道探针 prompt' className='text-stone-900' />
        </div>
      </section>

      {/* trust */}
      <section className='max-w-4xl mx-auto px-4 text-center space-y-8 pb-10'>
        <h2 className='text-2xl font-bold text-stone-900'>为什么相信模镜</h2>
        <div className='grid sm:grid-cols-3 gap-4 text-left'>
          {[
            { t: '透明', d: '探针 prompt、评分公式、权重默认值 —— 全部公开在 /methodology' },
            { t: '中立', d: '不卖 API、不收推广费、不接广告。收入来自企业咨询。' },
            { t: '可质疑', d: '评分有异议？欢迎在 GitHub 提 issue / PR，我们公开讨论。' },
          ].map((p) => (
            <div key={p.t} className='mj-card p-5'>
              <div className='text-stone-900 font-bold mb-1.5'>{p.t}</div>
              <p className='text-sm text-stone-500 leading-relaxed'>{p.d}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

function Stat({
  value,
  label,
  className = '',
}: {
  value: number
  label: string
  className?: string
}) {
  return (
    <div className='bg-white p-6 text-center'>
      <div className={`text-4xl font-bold mj-mono ${className}`}>{value.toLocaleString()}</div>
      <div className='text-xs text-stone-500 mt-1.5'>{label}</div>
    </div>
  )
}
