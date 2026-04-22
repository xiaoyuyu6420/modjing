type CodexRadar = {
  monitoredAt?: string
  timezone?: string
  windowOpen?: boolean
  status?: string
  recommendedAction?: string
  window?: {
    title?: string
    message?: string
    openedAt?: string
    closedAt?: string | null
    sourceUrl?: string
  }
  prediction?: {
    level?: string
    probability24h?: number
    probability48h?: number
    summary?: string
    positiveSignals?: string[]
    negativeSignals?: string[]
    expectedWindow?: string
    updatedAt?: string
  }
  links?: { html?: string; rss?: string }
}

export const metadata = {
  title: 'Codex 窗口监控 - 模镜',
  description: 'Codex 用量重置窗口的实时状态与预测概率，数据来自 hvoy.ai。',
}

async function getCodexRadar(): Promise<CodexRadar | null> {
  try {
    const res = await fetch('https://hvoy.ai/__codex-radar', {
      next: { revalidate: 300 },
    })
    if (!res.ok) return null
    return (await res.json()) as CodexRadar
  } catch {
    return null
  }
}

function actionLabel(a?: string): string {
  if (a === 'use_remaining_tokens') return '建议尽快用完剩余额度'
  if (a === 'wait') return '建议等待，重置概率低'
  if (a === 'monitor') return '观察中，无明确动作'
  return a ?? '—'
}

function levelTone(l?: string): string {
  if (l === 'high') return 'text-red-600'
  if (l === 'medium') return 'text-yellow-600'
  if (l === 'low') return 'text-green-600'
  return 'text-stone-500'
}

export default async function CodexRadarPage() {
  const data = await getCodexRadar()

  return (
    <main className='min-h-screen bg-stone-50 text-stone-900'>
      <div className='mx-auto max-w-5xl px-6 py-10'>
        <header className='mb-6'>
          <h1 className='text-3xl font-bold'>Codex 窗口监控</h1>
          <p className='mt-2 text-sm text-stone-500'>
            OpenAI Codex 用量限制重置窗口的实时状态与未来 24/48 小时的概率预测。
          </p>
        </header>

        {!data ? (
          <div className='rounded-lg border border-red-200 bg-red-50 p-6 text-sm text-red-700'>
            无法从上游 (hvoy.ai) 获取数据，请稍后再试。
          </div>
        ) : (
          <>
            <section
              className={
                'mb-6 rounded-lg border p-6 ' +
                (data.windowOpen
                  ? 'border-green-700 bg-brand-50'
                  : 'border-stone-200 bg-white')
              }
            >
              <div className='flex items-center justify-between'>
                <div>
                  <div className='mb-1 text-xs text-stone-500'>当前窗口状态</div>
                  <div className='text-2xl font-bold'>
                    {data.windowOpen ? (
                      <span className='text-green-600'>● OPEN</span>
                    ) : (
                      <span className='text-stone-400'>● CLOSED</span>
                    )}
                    <span className='ml-3 text-sm font-normal text-stone-500'>
                      {data.status ?? ''}
                    </span>
                  </div>
                </div>
                <div className='text-right text-xs text-stone-400'>
                  {data.monitoredAt && (
                    <div>
                      监控于 {new Date(data.monitoredAt).toLocaleString('zh-CN')}
                    </div>
                  )}
                  {data.timezone && <div>{data.timezone}</div>}
                </div>
              </div>
              <div className='mt-4 rounded bg-stone-50 p-3 text-sm'>
                <span className='text-stone-500'>推荐动作：</span>
                <span className='font-semibold text-brand-600'>
                  {actionLabel(data.recommendedAction)}
                </span>
              </div>
              {data.window?.message && (
                <p className='mt-3 text-sm text-stone-600'>{data.window.message}</p>
              )}
              {data.window?.sourceUrl && (
                <a
                  href={data.window.sourceUrl}
                  target='_blank'
                  rel='noreferrer'
                  className='mt-2 inline-block text-xs text-brand-600 hover:underline'
                >
                  原始信号来源 →
                </a>
              )}
            </section>

            {data.prediction && (
              <section className='mb-6 rounded-lg border border-stone-200 bg-white p-6'>
                <h2 className='mb-4 text-sm font-semibold text-stone-600'>预测</h2>
                <div className='mb-4 grid grid-cols-3 gap-4'>
                  <ProbCard
                    label='紧迫度'
                    value={(data.prediction.level ?? '—').toUpperCase()}
                    tone={levelTone(data.prediction.level)}
                  />
                  <ProbCard
                    label='24 小时内开窗概率'
                    value={fmtPct(data.prediction.probability24h)}
                    tone='text-brand-600'
                  />
                  <ProbCard
                    label='48 小时内开窗概率'
                    value={fmtPct(data.prediction.probability48h)}
                    tone='text-brand-600'
                  />
                </div>
                {data.prediction.summary && (
                  <p className='mb-4 text-sm leading-relaxed text-stone-600'>
                    {data.prediction.summary}
                  </p>
                )}
                <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                  <SignalList
                    title='正向信号'
                    items={data.prediction.positiveSignals}
                    color='text-brand-700'
                  />
                  <SignalList
                    title='反向信号'
                    items={data.prediction.negativeSignals}
                    color='text-red-700'
                  />
                </div>
              </section>
            )}
          </>
        )}

        <footer className='mt-8 border-t border-stone-200 pt-4 text-xs text-stone-400'>
          数据来源：
          <a
            href='https://hvoy.ai/__codex-radar'
            target='_blank'
            rel='noreferrer'
            className='text-brand-600 hover:underline'
          >
            hvoy.ai
          </a>
          。模镜仅做聚合展示，缓存 5 分钟。
        </footer>
      </div>
    </main>
  )
}

function fmtPct(v: number | undefined): string {
  if (v == null) return '—'
  return `${Math.round(v * 100)}%`
}

function ProbCard({
  label,
  value,
  tone,
}: {
  label: string
  value: string
  tone: string
}) {
  return (
    <div className='rounded border border-stone-200 bg-stone-50 p-4'>
      <div className='mb-1 text-xs text-stone-400'>{label}</div>
      <div className={`text-2xl font-bold ${tone}`}>{value}</div>
    </div>
  )
}

function SignalList({
  title,
  items,
  color,
}: {
  title: string
  items?: string[]
  color: string
}) {
  if (!items || !items.length) return null
  return (
    <div>
      <h3 className={`mb-2 text-xs font-semibold ${color}`}>{title}</h3>
      <ul className='space-y-1.5 text-xs text-stone-500'>
        {items.map((s, i) => (
          <li key={i} className='flex gap-2'>
            <span className='shrink-0 text-stone-400'>•</span>
            <span>{s}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
