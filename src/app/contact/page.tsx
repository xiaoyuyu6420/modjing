import Link from 'next/link'

export default function ContactPage() {
  return (
    <div className='max-w-2xl mx-auto px-4 py-10 space-y-8'>
      <header className='space-y-3'>
        <h1 className='text-3xl font-bold'>联系我们</h1>
        <p className='text-gray-400'>
          模镜团队是一群对 LLM 中转站市场充满好奇的开发者，希望用透明的评测帮用户少踩坑。
        </p>
      </header>

      <section className='bg-gray-900 border border-gray-800 rounded-lg p-6 space-y-4'>
        <div>
          <div className='text-sm text-gray-400 mb-1'>邮箱</div>
          <a
            href='mailto:hello@modjing.com'
            className='text-blue-400 hover:text-blue-300 font-mono'
          >
            hello@modjing.com
          </a>
        </div>

        <div>
          <div className='text-sm text-gray-400 mb-2'>微信</div>
          <div className='w-48 h-48 bg-gray-800 flex items-center justify-center text-gray-500 text-sm rounded'>
            微信二维码 placeholder
          </div>
        </div>
      </section>

      <section className='bg-gray-900 border border-gray-800 rounded-lg p-6 space-y-3'>
        <h2 className='text-lg font-bold'>想被收录？</h2>
        <p className='text-gray-400 text-sm'>
          模镜目前已收录 447 家中转站。如果你是站长希望被收录、或对评分有异议，欢迎沟通。
        </p>
        <Link
          href='/consult'
          className='inline-block px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded'
        >
          填写咨询表单 →
        </Link>
      </section>

      <section className='text-sm text-gray-500 space-y-2'>
        <p>媒体合作 / 商务咨询：同上邮箱。</p>
        <p>评分申诉：请附站点 URL 与具体争议项，我们 7 个工作日内回复。</p>
      </section>
    </div>
  )
}
