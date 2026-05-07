import Link from 'next/link'
import { prisma } from '@/lib/prisma'

async function getStats() {
  const [siteCount, priceCount, modelCount] = await Promise.all([
    prisma.site.count(),
    prisma.siteModelPrice.count(),
    prisma.siteModelPrice.groupBy({
      by: ['modelName'],
      _count: { modelName: true },
    }).then((rows) => rows.length),
  ])
  return { siteCount, priceCount, modelCount }
}

const TICKER_ITEMS = [
  { time: '[10:58:22]', site: 'API2D', action: '触发健康度告警', val: '↓ 92%', valColor: 'text-red-500' },
  { time: '[10:58:19]', site: 'OhMyGPT', action: '更新模型定级', val: 'A+', valColor: 'text-brand-600' },
  { time: '[10:58:05]', site: 'GPT-4o', action: '平均延迟测试完成', val: '412ms', valColor: 'text-stone-900' },
  { time: '[10:57:42]', site: 'DeepSeek', action: '价格池数据同步', val: 'Synced', valColor: 'text-brand-600' },
  { time: '[10:57:11]', site: 'AI-Hub', action: '探测节点连通率上升', val: '↑ 99.9%', valColor: 'text-brand-600' },
  { time: '[10:56:55]', site: 'ClaudeAPI', action: '掺水检测通过', val: 'Clean', valColor: 'text-brand-600' },
  { time: '[10:56:33]', site: 'OneAPI', action: '响应时间波动', val: '± 12%', valColor: 'text-stone-500' },
  { time: '[10:56:08]', site: 'Azure', action: 'SLA 承诺达标', val: '100%', valColor: 'text-brand-600' },
  /* 复制一份用于无缝滚动 */
  { time: '[10:58:22]', site: 'API2D', action: '触发健康度告警', val: '↓ 92%', valColor: 'text-red-500' },
  { time: '[10:58:19]', site: 'OhMyGPT', action: '更新模型定级', val: 'A+', valColor: 'text-brand-600' },
  { time: '[10:58:05]', site: 'GPT-4o', action: '平均延迟测试完成', val: '412ms', valColor: 'text-stone-900' },
  { time: '[10:57:42]', site: 'DeepSeek', action: '价格池数据同步', val: 'Synced', valColor: 'text-brand-600' },
  { time: '[10:57:11]', site: 'AI-Hub', action: '探测节点连通率上升', val: '↑ 99.9%', valColor: 'text-brand-600' },
  { time: '[10:56:55]', site: 'ClaudeAPI', action: '掺水检测通过', val: 'Clean', valColor: 'text-brand-600' },
  { time: '[10:56:33]', site: 'OneAPI', action: '响应时间波动', val: '± 12%', valColor: 'text-stone-500' },
  { time: '[10:56:08]', site: 'Azure', action: 'SLA 承诺达标', val: '100%', valColor: 'text-brand-600' },
]

export default async function Home() {
  const stats = await getStats()
  const { siteCount, priceCount, modelCount } = stats

  return (
    <div className='relative w-full overflow-x-hidden'>
      {/* 背景层 */}
      <div className='bg-matrix' />
      <div className='fixed inset-0 z-0 overflow-hidden pointer-events-none'>
        <div className='aurora-blob aurora-blob-1' />
        <div className='aurora-blob aurora-blob-2' />
        <div className='aurora-blob aurora-blob-3' />
      </div>

      <div className='relative z-10 w-full max-w-[90rem] mx-auto px-6 md:px-12 pt-16 md:pt-24 pb-12'>
        {/* ═══ Hero 区：左文案 + 右雷达 ═══ */}
        <div className='grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start'>

          {/* 左侧：文案 + 搜索 */}
          <div className='lg:col-span-7 flex flex-col justify-center pt-4 md:pt-8'>
            <div
              className='inline-flex items-center gap-2 px-3 py-1.5 rounded-md border border-brand-200/60 bg-white/60 backdrop-blur-md shadow-sm mb-4 spring-enter'
              style={{ animationDelay: '0.1s' }}
            >
              <span className='w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]' />
              <span className='text-brand-700 font-bold text-[11px]'>第三方独立评测 · 透明可复现</span>
            </div>

            <h1
              className='text-[3rem] md:text-[4.25rem] font-extrabold tracking-tight leading-[1.1] mb-6 spring-enter'
              style={{ animationDelay: '0.15s' }}
            >
              做裁判，<br />
              <span className='text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-teal-500 drop-shadow-sm'>不做运动员。</span>
            </h1>

            <p
              className='text-[1.125rem] text-stone-500 leading-relaxed font-medium mb-10 max-w-xl spring-enter'
              style={{ animationDelay: '0.2s' }}
            >
              基于 {stats.modelCount} 道硬核探针维度，为您提供全网中转站 {stats.siteCount} 家站点 {stats.priceCount} 条渠道 100% 透明、可复现的健康度图谱。
            </p>

            <div className='w-full max-w-2xl spring-enter' style={{ animationDelay: '0.25s' }}>
              <form action='/sites' className='search-glass mb-4'>
                <svg className='w-5 h-5 text-stone-400 mr-2 shrink-0' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.5'>
                  <circle cx='11' cy='11' r='8' />
                  <line x1='21' y1='21' x2='16.65' y2='16.65' />
                </svg>
                <input
                  type='text'
                  name='q'
                  className='flex-1 bg-transparent border-none outline-none text-stone-900 text-[1.0625rem] font-medium placeholder:text-stone-400 placeholder:font-normal'
                  placeholder='搜中转站、模型或厂商，例如 DeepSeek...'
                />
                <button type='submit' className='btn-super group shrink-0'>
                  <div className='flow' />
                  <div className='glass'>
                    <span className='content flex items-center gap-1.5'>
                      全局透视
                      <svg className='w-3.5 h-3.5 transition-transform group-hover:translate-x-1' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.5'>
                        <path d='M5 12h14M12 5l7 7-7 7' />
                      </svg>
                    </span>
                  </div>
                </button>
              </form>
              <div className='flex flex-wrap items-center gap-2 text-[12px]'>
                <span className='text-stone-400 font-medium mr-1'>Trending:</span>
                <a href='/sites?q=GPT-4o' className='px-2.5 py-1 rounded-md bg-white/60 border border-stone-200/50 backdrop-blur-sm shadow-sm text-stone-600 hover:bg-white hover:border-stone-300 hover:shadow-md transition-all font-medium'>GPT-4o</a>
                <a href='/sites?q=Claude' className='px-2.5 py-1 rounded-md bg-white/60 border border-stone-200/50 backdrop-blur-sm shadow-sm text-stone-600 hover:bg-white hover:border-stone-300 hover:shadow-md transition-all font-medium'>Claude-3.5</a>
                <a href='/sites?q=DeepSeek' className='px-2.5 py-1 rounded-md bg-white/60 border border-stone-200/50 backdrop-blur-sm shadow-sm text-stone-600 hover:bg-white hover:border-stone-300 hover:shadow-md transition-all font-medium'>DeepSeek-Coder</a>
                <a href='/sites?q=Qwen' className='px-2.5 py-1 rounded-md bg-white/60 border border-stone-200/50 backdrop-blur-sm shadow-sm text-stone-600 hover:bg-white hover:border-stone-300 hover:shadow-md transition-all font-medium'>Qwen-Max</a>
              </div>
            </div>
          </div>

          {/* 右侧：实时雷达卡片 */}
          <div className='lg:col-span-5 spring-enter' style={{ animationDelay: '0.3s' }}>
            <div className='bento-card hover-spring p-1.5'>
              <div className='bg-white/80 rounded-[16px] p-5 shadow-[inset_0_2px_10px_rgba(0,0,0,0.02)] h-[320px] flex flex-col relative z-10 border border-stone-100/50'>
                <div className='flex justify-between items-center mb-4 pb-3 border-b border-stone-100'>
                  <h3 className='text-[14px] font-bold text-stone-900 flex items-center gap-2'>
                    <span className='relative flex h-2 w-2'>
                      <span className='animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75' />
                      <span className='relative inline-flex rounded-full h-2 w-2 bg-red-500' />
                    </span>
                    实时探针雷达 (Live)
                  </h3>
                  <span className='text-[11px] font-mono text-stone-400'>演示数据</span>
                </div>

                <div className='flex-1 overflow-hidden relative' style={{ maskImage: 'linear-gradient(to bottom, black 80%, transparent)' }}>
                  <div className='ticker-scroll flex flex-col gap-3'>
                    {TICKER_ITEMS.map((item, i) => (
                      <div
                        key={i}
                        className='flex items-center justify-between text-[12px] p-1.5 rounded-lg hover:bg-stone-50 transition-colors'
                      >
                        <div className='flex items-center gap-2 text-stone-600 truncate'>
                          <span className='font-mono text-stone-400 shrink-0'>{item.time}</span>
                          <b className='text-stone-800 shrink-0'>{item.site}</b>
                          <span className='truncate'>{item.action}</span>
                        </div>
                        <span className={`font-mono font-medium shrink-0 ml-2 ${item.valColor}`}>{item.val}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ═══ Bento 卡片区：统计 + 功能 ═══ */}
        <div className='grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-5 mt-6 spring-enter' style={{ animationDelay: '0.4s' }}>

          {/* 收录节点 */}
          <div className='bento-card p-5 flex flex-col justify-between hover-spring lg:col-span-1'>
            <span className='text-stone-400 text-[11px] font-bold tracking-widest uppercase mb-4'>收录节点</span>
            <span className='text-4xl font-extrabold tracking-tight text-stone-900 drop-shadow-sm'>{siteCount}</span>
          </div>

          {/* 活跃比价 */}
          <div className='bento-card p-5 flex flex-col justify-between hover-spring lg:col-span-1'>
            <span className='text-stone-400 text-[11px] font-bold tracking-widest uppercase mb-4'>活跃比价</span>
            <span className='text-4xl font-extrabold tracking-tight text-brand-600 drop-shadow-sm'>
              {Math.floor(priceCount / 1000)}<span className='text-2xl'>k</span>
            </span>
          </div>

          {/* 探针维度 */}
          <div className='bento-card p-5 flex flex-col justify-between hover-spring lg:col-span-1'>
            <span className='text-stone-400 text-[11px] font-bold tracking-widest uppercase mb-4'>模型覆盖</span>
            <span className='text-4xl font-extrabold tracking-tight text-stone-900 drop-shadow-sm'>{modelCount}</span>
          </div>

          {/* 检测服务 */}
          <div className='bento-card p-5 flex flex-col justify-between hover-spring lg:col-span-1'>
            <span className='text-stone-400 text-[11px] font-bold tracking-widest uppercase mb-4'>检测服务</span>
            <span className='text-4xl font-extrabold tracking-tight text-stone-900 drop-shadow-sm'>2</span>
          </div>

          {/* 方法论卡片 */}
          <Link href='/methodology' className='bento-card p-5 hover-spring lg:col-span-1 group flex flex-col justify-between'>
            <div>
              <div className='w-10 h-10 rounded-xl bg-white/60 border border-stone-200/50 shadow-sm flex items-center justify-center mb-4 group-hover:bg-brand-50 group-hover:border-brand-200 transition-colors'>
                <svg className='w-5 h-5 text-stone-600 group-hover:text-brand-600' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'>
                  <path d='M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z' />
                </svg>
              </div>
              <h3 className='text-lg font-bold text-stone-900 mb-1'>排位方法论</h3>
              <p className='text-[13px] text-stone-500 leading-relaxed font-medium'>
                探针规则、指纹甄别及加权公式 100% 公开。
              </p>
            </div>
          </Link>

          {/* 企业合规卡片 */}
          <Link href='/enterprise' className='bento-card-dark p-5 hover-spring lg:col-span-1 group flex flex-col justify-between'>
            <div>
              <div className='flex justify-between items-start mb-4'>
                <div className='w-10 h-10 rounded-xl bg-stone-800/80 border border-stone-700/50 shadow-inner flex items-center justify-center group-hover:bg-brand-600 group-hover:border-brand-500 transition-colors'>
                  <svg className='w-5 h-5 text-stone-300 group-hover:text-white' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'>
                    <rect x='3' y='3' width='18' height='18' rx='2' ry='2' />
                    <line x1='3' y1='9' x2='21' y2='9' />
                    <line x1='9' y1='21' x2='9' y2='9' />
                  </svg>
                </div>
                <span className='px-2 py-1 bg-stone-800/80 border border-stone-700/50 text-brand-400 rounded text-[10px] font-bold uppercase tracking-wider shadow-sm'>Pro</span>
              </div>
              <h3 className='text-lg font-bold text-white mb-1'>企业合规</h3>
              <p className='text-[13px] text-stone-400 leading-relaxed font-medium'>
                透视专票资质、数据本地化及 SLA 赔付条款。
              </p>
            </div>
          </Link>
        </div>

        {/* ═══ 快速入口：3 大意图卡片 ═══ */}
        <div className='grid grid-cols-1 md:grid-cols-3 gap-5 mt-6 spring-enter' style={{ animationDelay: '0.5s' }}>
          <Link href='/sites' className='bento-card p-6 hover-spring group'>
            <div className='w-12 h-12 rounded-2xl bg-brand-50 border border-brand-200/50 flex items-center justify-center mb-4 group-hover:bg-brand-100 transition-colors'>
              <svg className='w-6 h-6 text-brand-600' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'>
                <circle cx='11' cy='11' r='8' /><line x1='21' y1='21' x2='16.65' y2='16.65' />
              </svg>
            </div>
            <h3 className='text-xl font-bold text-stone-900 mb-2'>探索中转站</h3>
            <p className='text-[13px] text-stone-500 leading-relaxed font-medium mb-4'>
              {siteCount} 家深度扫描，价格、健康度、掺水检测、合规字段一揽子对比。
            </p>
            <span className='text-[13px] font-semibold text-brand-600 group-hover:text-brand-700 flex items-center gap-1'>
              进入站点库 <svg className='w-3.5 h-3.5 transition-transform group-hover:translate-x-1' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.5'><path d='M5 12h14M12 5l7 7-7 7' /></svg>
            </span>
          </Link>

          <Link href='/model-select' className='bento-card p-6 hover-spring group'>
            <div className='w-12 h-12 rounded-2xl bg-brand-50 border border-brand-200/50 flex items-center justify-center mb-4 group-hover:bg-brand-100 transition-colors'>
              <svg className='w-6 h-6 text-brand-600' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'>
                <polygon points='12 2 2 7 12 12 22 7 12 2' /><polyline points='2 17 12 22 22 17' /><polyline points='2 12 12 17 22 12' />
              </svg>
            </div>
            <h3 className='text-xl font-bold text-stone-900 mb-2'>模型择优</h3>
            <p className='text-[13px] text-stone-500 leading-relaxed font-medium mb-4'>
              输入你的使用场景，自动匹配最优模型 + 最稳中转站组合。
            </p>
            <span className='text-[13px] font-semibold text-brand-600 group-hover:text-brand-700 flex items-center gap-1'>
              开始选择 <svg className='w-3.5 h-3.5 transition-transform group-hover:translate-x-1' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.5'><path d='M5 12h14M12 5l7 7-7 7' /></svg>
            </span>
          </Link>

          <Link href='/benchmark' className='bento-card p-6 hover-spring group'>
            <div className='w-12 h-12 rounded-2xl bg-brand-50 border border-brand-200/50 flex items-center justify-center mb-4 group-hover:bg-brand-100 transition-colors'>
              <svg className='w-6 h-6 text-brand-600' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'>
                <polyline points='22 12 18 12 15 21 9 3 6 12 2 12' />
              </svg>
            </div>
            <h3 className='text-xl font-bold text-stone-900 mb-2'>实时测速</h3>
            <p className='text-[13px] text-stone-500 leading-relaxed font-medium mb-4'>
              输入你的 API Key，30 秒内测出延迟、吞吐量、掺水率和可用模型。
            </p>
            <span className='text-[13px] font-semibold text-brand-600 group-hover:text-brand-700 flex items-center gap-1'>
              测我的 Key <svg className='w-3.5 h-3.5 transition-transform group-hover:translate-x-1' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.5'><path d='M5 12h14M12 5l7 7-7 7' /></svg>
            </span>
          </Link>
        </div>

        {/* ═══ 信任背书 ═══ */}
        <div className='max-w-4xl mx-auto text-center space-y-6 mt-12 spring-enter' style={{ animationDelay: '0.6s' }}>
          <h2 className='text-2xl font-bold text-stone-900'>为什么相信模镜</h2>
          <div className='grid sm:grid-cols-3 gap-4 text-left'>
            {[
              { t: '透明', d: '探针 prompt、评分公式、权重默认值 —— 全部公开在 /methodology' },
              { t: '中立', d: '不卖 API、不收推广费、不接广告。收入来自企业咨询。' },
              { t: '可质疑', d: '评分有异议？欢迎在 GitHub 提 issue / PR，我们公开讨论。' },
            ].map((p) => (
              <div key={p.t} className='bento-card p-5'>
                <div className='text-stone-900 font-bold mb-1.5'>{p.t}</div>
                <p className='text-sm text-stone-500 leading-relaxed'>{p.d}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
