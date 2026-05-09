import Link from 'next/link'

export default function Footer() {
  return (
    <footer className='relative z-10 w-full border-t border-stone-200/60 spring-enter' style={{ animationDelay: '0.7s' }}>
      <div className='w-full h-px bg-gradient-to-r from-transparent via-stone-200 to-transparent max-w-[90rem] mx-auto' />
      <div className='max-w-[90rem] mx-auto px-6 md:px-12 py-12 grid grid-cols-1 md:grid-cols-4 gap-8 text-sm'>
        <div className='md:col-span-2'>
          <div className='flex items-center gap-2.5 mb-3'>
            <div className='relative w-8 h-8 flex items-center justify-center'>
              <svg className='w-7 h-7 text-brand-600' viewBox='0 0 32 32' fill='none' stroke='currentColor' strokeWidth='1.8' strokeLinecap='round' strokeLinejoin='round'>
                <polygon points='16,2 30,9 30,23 16,30 2,23 2,9' stroke='currentColor' fill='rgba(16,185,129,0.05)' />
                <polygon points='16,8 24,12 24,20 16,24 8,20 8,12' stroke='currentColor' fill='rgba(16,185,129,0.15)' />
                <line x1='16' y1='2' x2='16' y2='8' />
                <line x1='30' y1='9' x2='24' y2='12' />
                <line x1='30' y1='23' x2='24' y2='20' />
                <line x1='16' y1='30' x2='16' y2='24' />
                <line x1='2' y1='23' x2='8' y2='20' />
                <line x1='2' y1='9' x2='8' y2='12' />
                <circle cx='16' cy='16' r='2' fill='#059669' stroke='none' />
              </svg>
            </div>
            <span className='text-stone-900 font-extrabold text-[17px] tracking-tight'>Modjing</span>
          </div>
          <p className='text-stone-500 max-w-md leading-relaxed font-medium'>
            中转站评测平台 — 做裁判，不做运动员。消除大模型 API 服务的信息不对称，
            所有评分透明可复现，所有方法论公开可质疑。
          </p>
        </div>

        <div className='flex flex-col gap-2'>
          <div className='text-stone-700 font-semibold mb-1 text-[13px]'>关于</div>
          <Link href='/methodology' className='text-stone-500 hover:text-brand-600 transition-colors font-medium'>
            方法论公开
          </Link>
          <Link href='/contact' className='text-stone-500 hover:text-brand-600 transition-colors font-medium'>
            联系我们
          </Link>
          <Link href='/terms' className='text-stone-500 hover:text-brand-600 transition-colors font-medium'>
            用户协议
          </Link>
          <Link href='/privacy' className='text-stone-500 hover:text-brand-600 transition-colors font-medium'>
            隐私政策
          </Link>
        </div>

        <div className='text-stone-500'>
          <div className='text-stone-700 font-semibold mb-2 text-[13px]'>数据归属</div>
          <p className='font-medium'>
            部分探针数据来源 <span className='text-stone-700 font-bold'>hvoy.ai</span> 公开 API，致谢。
          </p>
          <p className='mt-2 text-xs text-stone-400'>
            评测结果仅供参考，最终决策请以实测为准。
          </p>
        </div>
      </div>
      <div className='border-t border-stone-200/60 py-4 text-center text-xs text-stone-400 font-medium'>
        © 2026 Modjing · modjing.com
      </div>
    </footer>
  )
}
