export const metadata = {
  title: 'RP 角色扮演 API 中转站专区 - 模镜',
  description: '面向角色扮演（RP）玩家的中转站推荐，关注小克活人感、出戏率、审查程度。',
}

type RpSite = {
  slug: string
  name: string
  domain: string
  headline: string
  tags: string[]
  review: string
}

const RP_SITES: RpSite[] = [
  {
    slug: 'qiyiguo',
    name: '奇异果 API',
    domain: 'api.qiyiguo.uk',
    headline: '社群强、有试吃',
    tags: ['RP友好', '多节点保障'],
    review: '吃了一圈还是奇异果 api 最好，群主温柔群友善于解答。',
  },
  {
    slug: 'zhailian',
    name: '宅恋',
    domain: 'az.zlapi.vip',
    headline: '适合 RP 风格用户',
    tags: ['RP友好', '多模型'],
    review: '签到送额度，小克和 Gemini 活人感不错。',
  },
  {
    slug: 'sunnypumpkinapi',
    name: 'SunnyPumpkinAPI',
    domain: 'gua.guagua.uk',
    headline: '24 年老站',
    tags: ['Claude'],
    review: '纯血克，贵但稳定。',
  },
  {
    slug: 'fukaka',
    name: '芙卡卡',
    domain: 'api.fuka.win',
    headline: '小克和 4.6o 好吃',
    tags: ['RP友好'],
    review: '性价比不错，出图速度快。',
  },
  {
    slug: 'ekan8',
    name: 'Ekan8',
    domain: 'api.ekan8.com',
    headline: '质量稳定 + 试吃',
    tags: ['多模型', 'RP友好', '文生图'],
    review: '小 e 和按量 L 强烈推荐，文生图超好用。',
  },
  {
    slug: 'hajimi',
    name: '哈基米',
    domain: 'api.gemai.cc',
    headline: '支持的模型供应商多',
    tags: ['RP友好', '支持模型多'],
    review: '适合学生党/酒馆玩家，连接稳定。',
  },
  {
    slug: 'chuiertu',
    name: '垂耳兔',
    domain: 'loptu.net',
    headline: '注册送 50 额度',
    tags: ['注册送额度', 'RP友好'],
    review: '有五毛一条的官 4.6o，逆向两毛。',
  },
]

const JARGON = [
  ['小克', '逆向（非官方）Claude 接口，便宜但风格略不稳定'],
  ['纯血克 / 官转', '官方 Claude 接口的直接转发，贵但回复风格最稳'],
  ['活人感', 'RP 场景下 LLM 回复的「人味」，少 AI 腔调、少俗套套话'],
  ['出戏率', '在 RP 中模型自爆「我是 AI」或拒绝继续扮演的频率'],
  ['审查程度', '模型对 NSFW / 暗黑题材的拒绝程度，越高越受限'],
]

export default function RpPage() {
  return (
    <main className='min-h-screen bg-stone-50 text-stone-900'>
      <div className='mx-auto max-w-7xl px-6 py-10'>
        <header className='mb-8'>
          <h1 className='text-3xl font-bold'>角色扮演（RP）API 中转站专区</h1>
          <p className='mt-2 text-sm text-stone-500'>
            酒馆玩家、互动小说、AI 角色扮演场景专用。关注的不是通用价格，而是小克活人感、
            出戏率、审查程度等垂直维度。
          </p>
        </header>

        <section className='mb-8 rounded-lg border border-stone-200 bg-white p-5'>
          <h2 className='mb-3 text-sm font-semibold text-stone-600'>圈内黑话</h2>
          <dl className='grid grid-cols-1 gap-3 text-sm md:grid-cols-2'>
            {JARGON.map(([term, def]) => (
              <div key={term} className='flex gap-2'>
                <dt className='shrink-0 font-semibold text-brand-600'>{term}</dt>
                <dd className='text-stone-500'>{def}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className='mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
          {RP_SITES.map((s) => (
            <article
              key={s.slug}
              className='flex flex-col rounded-lg border border-stone-200 bg-white p-5 transition hover:border-brand-200'
            >
              <header className='mb-2'>
                <h3 className='text-lg font-semibold text-stone-900'>{s.name}</h3>
                <p className='font-mono text-xs text-stone-400'>{s.domain}</p>
              </header>
              <p className='mb-3 text-sm text-stone-600'>{s.headline}</p>
              <div className='mb-3 flex flex-wrap gap-1'>
                {s.tags.map((t) => (
                  <span
                    key={t}
                    className='rounded bg-brand-50 px-2 py-0.5 text-xs text-brand-700'
                  >
                    {t}
                  </span>
                ))}
              </div>
              <blockquote className='mt-auto border-l-2 border-stone-300 pl-3 text-xs italic text-stone-500'>
                「{s.review}」
              </blockquote>
              <a
                href={`https://${s.domain}`}
                target='_blank'
                rel='noreferrer'
                className='mt-3 text-xs text-brand-600 hover:underline'
              >
                访问站点 →
              </a>
            </article>
          ))}
        </section>

        <section className='rounded-lg border border-stone-200 bg-white p-5'>
          <h2 className='mb-3 text-sm font-semibold text-stone-600'>RP 专属维度（建设中）</h2>
          <div className='grid grid-cols-1 gap-3 md:grid-cols-3'>
            {['出戏率', '审查程度', '活人感评分'].map((dim) => (
              <div key={dim} className='rounded border border-dashed border-stone-300 p-4'>
                <div className='mb-2 text-xs text-stone-500'>{dim}</div>
                <div className='h-2 w-full overflow-hidden rounded bg-stone-100'>
                  <div className='h-full w-1/3 bg-gradient-to-r from-brand-600 to-brand-500 opacity-40' />
                </div>
                <div className='mt-2 text-xs text-stone-400'>待 RP 探针数据接入</div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}
