import Link from 'next/link'

type NoticeValues = {
  siteId: number
  sourceType: string
  noticeText: string
  noticeUrl: string | null
  tagCategory: string
  publishedAt: Date | null
}

type Props = {
  sites: { id: number; name: string }[]
  notice?: NoticeValues
  action: (fd: FormData) => Promise<void>
}

function toLocalInput(d: Date) {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default function NoticeForm({ sites, notice, action }: Props) {
  return (
    <form action={action} className='max-w-2xl mx-auto space-y-5 pb-20'>
      <header>
        <Link href='/admin/notices' className='text-sm text-stone-500 hover:text-brand-700'>
          ← 公告列表
        </Link>
        <h1 className='text-2xl font-bold tracking-tight mt-1'>
          {notice ? '编辑公告' : '发布公告'}
        </h1>
      </header>

      <div className='mj-card p-5 sm:p-6 space-y-4'>
        <div className='grid sm:grid-cols-2 gap-x-5 gap-y-4'>
          <div>
            <label className='mj-label'>所属站点</label>
            <select name='siteId' defaultValue={notice ? String(notice.siteId) : ''} className='mj-select' required>
              <option value='' disabled>
                选择站点
              </option>
              {sites.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className='mj-label'>分类标签</label>
            <select name='tagCategory' defaultValue={notice?.tagCategory ?? 'notice'} className='mj-select'>
              <option value='important'>important · 重要</option>
              <option value='maintenance'>maintenance · 维护</option>
              <option value='update'>update · 更新</option>
              <option value='pricing'>pricing · 价格</option>
              <option value='promotion'>promotion · 促销</option>
              <option value='notice'>notice · 普通</option>
            </select>
          </div>
          <div>
            <label className='mj-label'>来源</label>
            <select name='sourceType' defaultValue={notice?.sourceType ?? 'manual'} className='mj-select'>
              <option value='manual'>manual · 手动</option>
              <option value='hvoy'>hvoy</option>
              <option value='crawl'>crawl · 抓取</option>
            </select>
          </div>
          <div>
            <label className='mj-label'>发布时间</label>
            <input
              name='publishedAt'
              type='datetime-local'
              defaultValue={notice?.publishedAt ? toLocalInput(notice.publishedAt) : ''}
              className='mj-input'
            />
          </div>
        </div>

        <div>
          <label className='mj-label'>公告内容</label>
          <textarea name='noticeText' defaultValue={notice?.noticeText ?? ''} rows={5} className='mj-input resize-y' required />
        </div>

        <div>
          <label className='mj-label'>原文链接（选填）</label>
          <input name='noticeUrl' defaultValue={notice?.noticeUrl ?? ''} placeholder='https://' className='mj-input' />
        </div>
      </div>

      <div className='flex items-center gap-2'>
        <button type='submit' className='mj-btn-primary'>保存</button>
        <Link href='/admin/notices' className='mj-btn-ghost'>取消</Link>
      </div>
    </form>
  )
}
