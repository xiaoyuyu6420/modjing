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
    icon: (
      <svg className='w-6 h-6' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={1.5}>
        <path strokeLinecap='round' strokeLinejoin='round' d='M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z' />
      </svg>
    ),
    title: '447 家中转站尽收眼底',
    desc: '全网覆盖最广的中转站数据库，含价格、健康度、合规字段、用户评价，每日更新。',
    cta: '浏览站点',
    href: '/sites',
    color: 'blue',
  },
  {
    icon: (
      <svg className='w-6 h-6' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={1.5}>
        <path strokeLinecap='round' strokeLinejoin='round' d='M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5' />
      </svg>
    ),
    title: '方法论完全公开 · 权重可调',
    desc: '32 道探针 + 4 维指纹算法 + 5 项加权评分公式全部开源。企业用户可拖滑块自定义权重。',
    cta: '看方法论',
    href: '/methodology',
    color: 'purple',
  },
  {
    icon: (
      <svg className='w-6 h-6' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={1.5}>
        <path strokeLinecap='round' strokeLinejoin='round' d='M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z' />
      </svg>
    ),
    title: '企业合规专区独家',
    desc: '发票、等保、数据本地化、合同模板、SLA 承诺 — 这些字段只有模镜在追踪。',
    cta: '进合规专区',
    href: '/enterprise',
    color: 'emerald',
  },
]

const TRUST_ITEMS = [
  {
    title: '透明',
    icon: (
      <svg className='w-8 h-8 text-blue-400' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={1.5}>
        <path strokeLinecap='round' strokeLinejoin='round' d='M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z' />
        <path strokeLinecap='round' strokeLinejoin='round' d='M15 12a3 3 0 11-6 0 3 3 0 016 0z' />
      </svg>
    ),
    desc: '探针 prompt、评分公式、权重默认值 — 全部公开在 /methodology',
  },
  {
    title: '中立',
    icon: (
      <svg className='w-8 h-8 text-emerald-400' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={1.5}>
        <path strokeLinecap='round' strokeLinejoin='round' d='M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0012 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 01-2.031.352 5.988 5.988 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L18.75 4.971zm-16.5.52c.99-.203 1.99-.377 3-.52m0 0l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.989 5.989 0 01-2.031.352 5.989 5.989 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L5.25 4.971z' />
      </svg>
    ),
    desc: '不卖 API、不收推广费、不接广告。收入来自企业咨询。',
  },
  {
    title: '可质疑',
    icon: (
      <svg className='w-8 h-8 text-purple-400' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={1.5}>
        <path strokeLinecap='round' strokeLinejoin='round' d='M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z' />
      </svg>
    ),
    desc: '评分有异议？欢迎在 GitHub 提 issue / PR，我们公开讨论。',
  },
]

const colorMap: Record<string, { icon: string; bg: string; border: string }> = {
  blue: { icon: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
  purple: { icon: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
  emerald: { icon: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
}

export default async function Home() {
  const { siteCount, priceCount } = await getStats()

  return (
    <div className='space-y-0'>
      {/* Hero */}
      <section className='relative overflow-hidden'>
        {/* Background glow */}
        <div className='absolute inset-0 pointer-events-none'>
          <div className='absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-to-b from-blue-600/20 via-purple-600/10 to-transparent rounded-full blur-3xl animate-glow' />
          <div className='absolute top-20 left-1/4 w-[400px] h-[400px] bg-gradient-to-br from-purple-600/15 to-transparent rounded-full blur-3xl animate-glow' style={{ animationDelay: '2s' }} />
          <div className='absolute top-40 right-1/4 w-[300px] h-[300px] bg-gradient-to-bl from-pink-600/10 to-transparent rounded-full blur-3xl animate-glow' style={{ animationDelay: '3s' }} />
        </div>

        <div className='relative px-4 pt-20 pb-16 text-center'>
          <div className='max-w-3xl mx-auto space-y-8'>
            <div className='space-y-4 animate-fade-up'>
              <div className='inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs font-medium'>
                <span className='w-1.5 h-1.5 rounded-full bg-blue-400 glow-dot text-blue-400' />
                已收录 {siteCount} 家中转站 · 实时更新
              </div>
              <h1 className='text-5xl sm:text-7xl font-bold tracking-tight'>
                模镜<span className='text-gray-600 mx-2'>·</span><span className='gradient-text'>Miro</span>
              </h1>
              <p className='text-xl sm:text-2xl text-gray-300 font-light'>
                中转站评测平台 — <span className='text-blue-400 font-medium'>做裁判</span>，不做运动员
              </p>
              <p className='text-sm text-gray-500 max-w-xl mx-auto leading-relaxed'>
                消除大模型 API 服务的信息不对称。所有评分透明可复现，所有方法论公开可质疑。
              </p>
            </div>

            {/* Search */}
            <form action='/sites' className='animate-fade-up-delay-1 flex gap-2 max-w-lg mx-auto'>
              <div className='flex-1 relative'>
                <input
                  type='text'
                  name='q'
                  placeholder='搜站点名 / 模型 / 厂商...'
                  className='w-full px-4 py-3.5 rounded-xl glass-card text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all'
                />
              </div>
              <button
                type='submit'
                className='px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium transition-all hover:shadow-lg hover:shadow-blue-600/25 active:scale-[0.98]'
              >
                搜索
              </button>
            </form>

            {/* CTA buttons */}
            <div className='animate-fade-up-delay-2 flex flex-wrap gap-3 justify-center'>
              <Link
                href='/leaderboard'
                className='group px-5 py-2.5 rounded-xl bg-white text-gray-900 font-medium hover:bg-gray-100 transition-all hover:shadow-lg hover:shadow-white/10 active:scale-[0.98] flex items-center gap-2'
              >
                <svg className='w-4 h-4' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2}>
                  <path strokeLinecap='round' strokeLinejoin='round' d='M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z' />
                </svg>
                看排行榜
              </Link>
              <Link
                href='/enterprise'
                className='px-5 py-2.5 rounded-xl border border-gray-700 text-gray-300 hover:text-gray-100 hover:border-gray-500 transition-all flex items-center gap-2'
              >
                <svg className='w-4 h-4' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2}>
                  <path strokeLinecap='round' strokeLinejoin='round' d='M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z' />
                </svg>
                企业合规
              </Link>
              <Link
                href='/benchmark'
                className='px-5 py-2.5 rounded-xl border border-gray-700 text-gray-300 hover:text-gray-100 hover:border-gray-500 transition-all flex items-center gap-2'
              >
                <svg className='w-4 h-4' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2}>
                  <path strokeLinecap='round' strokeLinejoin='round' d='M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z' />
                </svg>
                测我的 Key
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className='max-w-6xl mx-auto px-4 py-16'>
        <div className='grid md:grid-cols-3 gap-6'>
          {FEATURES.map((f, i) => {
            const c = colorMap[f.color]
            return (
              <Link
                key={f.title}
                href={f.href}
                className={`group relative glass-card gradient-border rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 animate-fade-up-delay-${i + 1}`}
              >
                <div className={`inline-flex p-2.5 rounded-xl ${c.bg} ${c.border} border mb-4`}>
                  <span className={c.icon}>{f.icon}</span>
                </div>
                <h3 className='text-lg font-bold text-gray-100 mb-2'>{f.title}</h3>
                <p className='text-sm text-gray-400 leading-relaxed mb-4'>{f.desc}</p>
                <div className={`text-sm font-medium ${c.icon} group-hover:translate-x-1 transition-transform flex items-center gap-1`}>
                  {f.cta}
                  <svg className='w-4 h-4' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2}>
                    <path strokeLinecap='round' strokeLinejoin='round' d='M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3' />
                  </svg>
                </div>
              </Link>
            )
          })}
        </div>
      </section>

      {/* Stats */}
      <section className='max-w-5xl mx-auto px-4 py-8'>
        <div className='glass-card rounded-2xl p-8'>
          <div className='grid grid-cols-3 gap-6 text-center'>
            <div className='space-y-2 animate-count'>
              <div className='text-4xl sm:text-5xl font-bold gradient-text'>{siteCount}</div>
              <div className='text-sm text-gray-400'>已收录中转站</div>
            </div>
            <div className='space-y-2 animate-count' style={{ animationDelay: '0.1s' }}>
              <div className='text-4xl sm:text-5xl font-bold text-emerald-400'>{priceCount}</div>
              <div className='text-sm text-gray-400'>价格条目</div>
            </div>
            <div className='space-y-2 animate-count' style={{ animationDelay: '0.2s' }}>
              <div className='text-4xl sm:text-5xl font-bold text-purple-400'>32</div>
              <div className='text-sm text-gray-400'>道探针 prompt</div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust */}
      <section className='max-w-4xl mx-auto px-4 py-16 text-center space-y-10'>
        <h2 className='text-3xl font-bold'>为什么相信模镜</h2>
        <div className='grid sm:grid-cols-3 gap-6'>
          {TRUST_ITEMS.map((item) => (
            <div key={item.title} className='glass-card rounded-2xl p-6 text-center space-y-3'>
              <div className='flex justify-center'>{item.icon}</div>
              <div className='text-lg font-bold text-gray-100'>{item.title}</div>
              <p className='text-sm text-gray-400 leading-relaxed'>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
