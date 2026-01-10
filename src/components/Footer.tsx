import Link from 'next/link'

export default function Footer() {
  return (
    <footer className='border-t border-gray-800 bg-gray-950 mt-16'>
      <div className='max-w-7xl mx-auto px-4 py-10 grid grid-cols-1 md:grid-cols-3 gap-8 text-sm'>
        <div>
          <div className='text-gray-100 font-bold text-base mb-2'>模镜 · Miro</div>
          <p className='text-gray-400'>
            中转站评测平台 — 做裁判，不做运动员。消除大模型 API 服务的信息不对称。
          </p>
        </div>

        <div className='flex flex-col gap-2'>
          <div className='text-gray-300 font-medium mb-1'>关于</div>
          <Link href='/methodology' className='text-gray-400 hover:text-gray-100'>
            方法论公开
          </Link>
          <Link href='/contact' className='text-gray-400 hover:text-gray-100'>
            联系我们
          </Link>
          <Link href='/terms' className='text-gray-400 hover:text-gray-100'>
            用户协议
          </Link>
          <Link href='/privacy' className='text-gray-400 hover:text-gray-100'>
            隐私政策
          </Link>
        </div>

        <div className='text-gray-400'>
          <div className='text-gray-300 font-medium mb-2'>数据归属</div>
          <p>
            部分探针数据来源 <span className='text-gray-200'>hvoy.ai</span> 公开 API，致谢。
          </p>
          <p className='mt-2 text-xs text-gray-500'>
            评测结果仅供参考，最终决策请以实测为准。
          </p>
        </div>
      </div>
      <div className='border-t border-gray-800 py-4 text-center text-xs text-gray-500'>
        © 2026 模镜 · Miro · modjing.com
      </div>
    </footer>
  )
}
