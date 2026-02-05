import Link from 'next/link'

export default function Footer() {
  return (
    <footer className='border-t border-gray-800/50 bg-gray-950 mt-20'>
      <div className='max-w-7xl mx-auto px-4 py-12'>
        <div className='grid grid-cols-1 md:grid-cols-4 gap-10 text-sm'>
          {/* Brand */}
          <div className='md:col-span-1 space-y-4'>
            <div className='flex items-center gap-2'>
              <div className='w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold'>
                M
              </div>
              <span className='text-base font-bold text-gray-100'>模镜 · Miro</span>
            </div>
            <p className='text-gray-400 leading-relaxed'>
              中转站评测平台 — 做裁判，不做运动员。消除大模型 API 服务的信息不对称。
            </p>
          </div>

          {/* Product */}
          <div className='space-y-3'>
            <div className='text-gray-200 font-semibold text-xs uppercase tracking-wider'>产品</div>
            <div className='flex flex-col gap-2'>
              <Link href='/sites' className='text-gray-400 hover:text-gray-100 transition-colors'>站点浏览</Link>
              <Link href='/models' className='text-gray-400 hover:text-gray-100 transition-colors'>模型对比</Link>
              <Link href='/leaderboard' className='text-gray-400 hover:text-gray-100 transition-colors'>排行榜</Link>
              <Link href='/benchmark' className='text-gray-400 hover:text-gray-100 transition-colors'>测速工具</Link>
              <Link href='/enterprise' className='text-gray-400 hover:text-gray-100 transition-colors'>企业合规</Link>
            </div>
          </div>

          {/* Resources */}
          <div className='space-y-3'>
            <div className='text-gray-200 font-semibold text-xs uppercase tracking-wider'>资源</div>
            <div className='flex flex-col gap-2'>
              <Link href='/methodology' className='text-gray-400 hover:text-gray-100 transition-colors'>方法论公开</Link>
              <Link href='/free' className='text-gray-400 hover:text-gray-100 transition-colors'>公益站</Link>
              <Link href='/plans' className='text-gray-400 hover:text-gray-100 transition-colors'>套餐对比</Link>
              <Link href='/consult' className='text-gray-400 hover:text-gray-100 transition-colors'>咨询服务</Link>
            </div>
          </div>

          {/* About */}
          <div className='space-y-3'>
            <div className='text-gray-200 font-semibold text-xs uppercase tracking-wider'>关于</div>
            <div className='flex flex-col gap-2'>
              <Link href='/contact' className='text-gray-400 hover:text-gray-100 transition-colors'>联系我们</Link>
              <Link href='/terms' className='text-gray-400 hover:text-gray-100 transition-colors'>用户协议</Link>
              <Link href='/privacy' className='text-gray-400 hover:text-gray-100 transition-colors'>隐私政策</Link>
            </div>
            <div className='pt-2 text-xs text-gray-500'>
              部分探针数据来源 hvoy.ai 公开 API，致谢。
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className='mt-10 pt-6 border-t border-gray-800/50 flex flex-col sm:flex-row items-center justify-between gap-3'>
          <p className='text-xs text-gray-500'>
            © 2026 模镜 · Miro · modjing.com
          </p>
          <p className='text-xs text-gray-500'>
            评测结果仅供参考，最终决策请以实测为准。
          </p>
        </div>
      </div>
    </footer>
  )
}
