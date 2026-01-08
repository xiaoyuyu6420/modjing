type Notice = {
  id: string
  relaySiteId?: number
  siteDomain?: string
  siteName?: string
  sourceType?: string
  noticeText?: string
  noticeUrl?: string
  signupUrl?: string
  publishedAt?: string
}

type NoticesResp = {
  updatedAt?: string
  pagination?: { total?: number }
  items?: Notice[]
}

export const metadata = {
  title: '中转站公告聚合 - 模镜',
  description: '汇总各 API 中转站的公告，自动按类型着色，方便快速浏览。',
}

function classifyNotice(text: string): string {
  const t = text.toLowerCase()
  if (/重要|紧急|urgent|important/.test(t)) return 'important'
  if (/维护|迁移|检修|maintenance|migration/.test(t)) return 'maintenance'
  if (/倍率|价格|计费|扣费|额度|余额|充值|补偿|降价|涨价|调价|rate|price|pricing|billing|credit/.test(t))
    return 'pricing'
  if (/活动|优惠|赠送|免费|折扣|注册|promotion|discount|bonus/.test(t)) return 'promotion'
  if (/更新|新增|上线|发布|上架|下架|升级|beta|update|release|upgrade/.test(t)) return 'update'
  return 'notice'
}

const TAG_STYLES: Record<string, { label: string; cls: string }> = {
  important: { label: '重要', cls: 'bg-red-950/60 text-red-300 border-red-900' },
  maintenance: { label: '维护', cls: 'bg-yellow-950/60 text-yellow-300 border-yellow-900' },
  update: { label: '更新', cls: 'bg-blue-950/60 text-blue-300 border-blue-900' },
  pricing: { label: '价格', cls: 'bg-orange-950/60 text-orange-300 border-orange-900' },
  promotion: { label: '活动', cls: 'bg-green-950/60 text-green-300 border-green-900' },
  notice: { label: '通知', cls: 'bg-gray-800 text-gray-300 border-gray-700' },
}

async function getNotices(): Promise<NoticesResp | null> {
  try {
    const res = await fetch('https://hvoy.ai/__relay-notices?limit=50', {
      next: { revalidate: 300 },
    })
    if (!res.ok) return null
    return (await res.json()) as NoticesResp
  } catch {
    return null
  }
}

export default async function NoticesPage() {
  const data = await getNotices()
  const items = data?.items ?? []

  return (
    <main className='min-h-screen bg-gray-950 text-gray-100'>
      <div className='mx-auto max-w-5xl px-6 py-10'>
        <header className='mb-6'>
          <h1 className='text-3xl font-bold'>中转站公告聚合</h1>
          <p className='mt-2 text-sm text-gray-400'>
            汇总各 API 中转站的最新公告，自动按重要 / 维护 / 价格 / 活动 / 更新分类。
          </p>
          {data?.updatedAt && (
            <p className='mt-1 text-xs text-gray-500'>
              更新于 {new Date(data.updatedAt).toLocaleString('zh-CN')}
              {data.pagination?.total ? `，上游共 ${data.pagination.total} 条` : ''}
            </p>
          )}
        </header>

        {!data ? (
          <div className='rounded-lg border border-red-900/50 bg-red-950/20 p-6 text-sm text-red-200'>
            无法从上游 (hvoy.ai) 获取数据，请稍后再试。
          </div>
        ) : items.length === 0 ? (
          <div className='rounded-lg border border-gray-800 bg-gray-900/50 p-6 text-sm text-gray-400'>
            暂无公告
          </div>
        ) : (
          <ul className='space-y-3'>
            {items.map((n) => {
              const tag = classifyNotice(n.noticeText ?? '')
              const style = TAG_STYLES[tag]
              const text = (n.noticeText ?? '').slice(0, 200)
              return (
                <li
                  key={n.id}
                  className='rounded-lg border border-gray-800 bg-gray-900/60 p-4 transition hover:border-gray-700'
                >
                  <div className='mb-2 flex flex-wrap items-center gap-2'>
                    <span
                      className={`rounded border px-2 py-0.5 text-xs font-semibold ${style.cls}`}
                    >
                      {style.label}
                    </span>
                    <a
                      href={n.noticeUrl ?? `https://${n.siteDomain}`}
                      target='_blank'
                      rel='noreferrer'
                      className='text-sm font-medium text-gray-100 hover:text-blue-400'
                    >
                      {n.siteName || n.siteDomain || '未知站点'}
                    </a>
                    {n.siteDomain && (
                      <span className='font-mono text-xs text-gray-500'>{n.siteDomain}</span>
                    )}
                    {n.publishedAt && (
                      <span className='ml-auto text-xs text-gray-500'>
                        {new Date(n.publishedAt).toLocaleString('zh-CN')}
                      </span>
                    )}
                  </div>
                  <p className='text-sm leading-relaxed text-gray-300'>
                    {text}
                    {(n.noticeText?.length ?? 0) > 200 && '…'}
                  </p>
                </li>
              )
            })}
          </ul>
        )}

        <footer className='mt-8 border-t border-gray-800 pt-4 text-xs text-gray-500'>
          数据来源：
          <a
            href='https://hvoy.ai/__relay-notices'
            target='_blank'
            rel='noreferrer'
            className='text-blue-400 hover:underline'
          >
            hvoy.ai
          </a>
          。模镜仅做聚合展示，缓存 5 分钟。
        </footer>
      </div>
    </main>
  )
}
