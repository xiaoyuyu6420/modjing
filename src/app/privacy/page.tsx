export default function PrivacyPage() {
  return (
    <div className='max-w-3xl mx-auto px-4 py-10 space-y-8'>
      <header className='space-y-2'>
        <h1 className='text-3xl font-bold'>隐私政策</h1>
        <p className='text-sm text-stone-400'>最后更新：2026 年 06 月 16 日</p>
      </header>

      <section className='space-y-3'>
        <h2 className='text-xl font-bold'>1. 我们收集什么</h2>
        <p className='text-stone-600'>
          仅匿名访问统计：页面 URL、引荐来源、浏览器类型、屏幕尺寸、停留时长。
          用于优化页面体验与改进评测维度。
        </p>
      </section>

      <section className='space-y-3'>
        <h2 className='text-xl font-bold'>2. 我们不收集什么</h2>
        <ul className='list-disc list-inside text-stone-600 space-y-1'>
          <li>不收集你的 API Key — 测速页所有请求在你的浏览器本地发起</li>
          <li>不收集真实姓名、身份证、银行卡等个人敏感信息</li>
          <li>不收集精确地理位置</li>
          <li>咨询表单提交后不入库，只在浏览器本地 alert</li>
        </ul>
      </section>

      <section className='space-y-3'>
        <h2 className='text-xl font-bold'>3. Cookie 使用</h2>
        <p className='text-stone-600'>
          本站仅使用必要 Cookie 维持你的偏好（如权重滑块设置）。不使用第三方广告追踪 Cookie。
        </p>
      </section>

      <section className='space-y-3'>
        <h2 className='text-xl font-bold'>4. 第三方服务</h2>
        <p className='text-stone-600'>
          本站托管在 Vercel，CDN 由 Cloudflare 提供。
          这些服务的隐私实践请参阅各自官网。我们不会主动向其传输用户身份信息。
        </p>
      </section>

      <section className='space-y-3'>
        <h2 className='text-xl font-bold'>5. 数据保留</h2>
        <p className='text-stone-600'>
          匿名访问日志最多保留 90 天。如果你希望删除任何与你相关的数据，请联系
          hello@modjing.com。
        </p>
      </section>
    </div>
  )
}
