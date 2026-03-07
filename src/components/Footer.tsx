import Link from 'next/link'

export default function Footer() {
  return (
    <footer className='border-t border-stone-200 bg-white mt-20'>
      <div className='max-w-7xl mx-auto px-4 py-12 grid grid-cols-1 md:grid-cols-4 gap-8 text-sm'>
        <div className='md:col-span-2'>
          <div className='flex items-center gap-2 mb-3'>
            <span className='grid h-6 w-6 place-items-center rounded-md bg-gradient-to-br from-brand-500 to-brand-700 text-white'>
              <svg width='12' height='12' viewBox='0 0 24 24' fill='none'>
                <circle cx='12' cy='12' r='8' stroke='currentColor' strokeWidth='2' />
                <circle cx='12' cy='12' r='3' fill='currentColor' />
              </svg>
            </span>
            <span className='text-stone-900 font-bold text-base'>模镜 · Miro</span>
          </div>
          <p className='text-stone-500 max-w-md leading-relaxed'>
            中转站评测平台 — 做裁判，不做运动员。消除大模型 API 服务的信息不对称，
            所有评分透明可复现，所有方法论公开可质疑。
          </p>
        </div>

        <div className='flex flex-col gap-2'>
          <div className='text-stone-700 font-medium mb-1'>关于</div>
          <Link href='/methodology' className='text-stone-500 hover:text-brand-700'>
            方法论公开
          </Link>
          <Link href='/contact' className='text-stone-500 hover:text-brand-700'>
            联系我们
          </Link>
          <Link href='/terms' className='text-stone-500 hover:text-brand-700'>
            用户协议
          </Link>
          <Link href='/privacy' className='text-stone-500 hover:text-brand-700'>
            隐私政策
          </Link>
        </div>

        <div className='text-stone-500'>
          <div className='text-stone-700 font-medium mb-2'>数据归属</div>
          <p>
            部分探针数据来源 <span className='text-stone-700'>hvoy.ai</span> 公开 API，致谢。
          </p>
          <p className='mt-2 text-xs text-stone-400'>
            评测结果仅供参考，最终决策请以实测为准。
          </p>
        </div>
      </div>
      <div className='border-t border-stone-200 py-4 text-center text-xs text-stone-400'>
        © 2026 模镜 · Miro · modjing.com
      </div>
    </footer>
  )
}
