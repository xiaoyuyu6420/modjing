import Link from 'next/link'

export default function ContactPage() {
  return (
    <div className='max-w-2xl mx-auto px-4 py-10 space-y-8'>
      <header className='space-y-3'>
        <h1 className='text-3xl font-bold'>联系我们</h1>
        <p className='text-stone-500'>
          模镜团队是一群对 LLM 中转站市场充满好奇的开发者，希望用透明的评测帮用户少踩坑。
        </p>
      </header>

      <section className='bg-white border border-stone-200 rounded-lg p-6 space-y-4'>
        <div>
          <div className='text-sm text-stone-500 mb-1'>邮箱</div>
          <a
            href='mailto:hello@modjing.com'
            className='text-brand-600 hover:text-brand-600 font-mono'
          >
            hello@modjing.com
          </a>
        </div>

        <div>
          <div className='text-sm text-stone-500 mb-2'>微信</div>
          <div className='w-48 h-48 bg-stone-100 flex items-center justify-center text-stone-400 text-sm rounded'>
            微信二维码 placeholder
          </div>
        </div>
      </section>

      <section className='bg-white border border-stone-200 rounded-lg p-6 space-y-3'>
        <h2 className='text-lg font-bold'>想被收录？</h2>
        <p className='text-stone-500 text-sm'>
          模镜目前已收录 447 家中转站。如果你是站长希望被收录、或对评分有异议，欢迎沟通。
        </p>
        <Link
          href='/consult'
          className='inline-block px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm rounded'
        >
          填写咨询表单 →
        </Link>
      </section>

      <section className='text-sm text-stone-400 space-y-2'>
        <p>媒体合作 / 商务咨询：同上邮箱。</p>
        <p>评分申诉：请附站点 URL 与具体争议项，我们 7 个工作日内回复。</p>
      </section>
    </div>
  )
}
