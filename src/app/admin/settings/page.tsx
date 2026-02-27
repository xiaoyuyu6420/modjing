export default function AdminSettings() {
  return (
    <div className='p-8 space-y-6'>
      <div>
        <h1 className='text-2xl font-bold text-gray-100'>站点设置</h1>
        <p className='text-sm text-gray-500 mt-1'>全局配置选项</p>
      </div>

      <div className='bg-gray-900/50 border border-gray-800/50 rounded-xl p-6 space-y-6'>
        <div>
          <h2 className='text-lg font-semibold text-gray-100 mb-4'>基础设置</h2>
          <div className='space-y-4'>
            <div>
              <label className='block text-xs text-gray-400 mb-1.5'>站点名称</label>
              <input
                defaultValue='模镜 Miro'
                className='w-full max-w-md px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50'
              />
            </div>
            <div>
              <label className='block text-xs text-gray-400 mb-1.5'>站点描述</label>
              <textarea
                defaultValue='消除大模型 API 服务的信息不对称'
                rows={2}
                className='w-full max-w-md px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none'
              />
            </div>
          </div>
        </div>

        <div className='border-t border-gray-800/50 pt-6'>
          <h2 className='text-lg font-semibold text-gray-100 mb-4'>探针设置</h2>
          <div className='space-y-4'>
            <div className='flex items-center justify-between max-w-md'>
              <div>
                <div className='text-sm text-gray-200'>自动健康检查</div>
                <div className='text-xs text-gray-500'>定期检查所有在线站点的 API 连通性</div>
              </div>
              <button className='px-3 py-1.5 text-xs bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors'>
                已启用
              </button>
            </div>
            <div className='flex items-center justify-between max-w-md'>
              <div>
                <div className='text-sm text-gray-200'>掺水检测</div>
                <div className='text-xs text-gray-500'>自动检测模型是否被替换或掺水</div>
              </div>
              <button className='px-3 py-1.5 text-xs bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors'>
                已启用
              </button>
            </div>
            <div className='flex items-center justify-between max-w-md'>
              <div>
                <div className='text-sm text-gray-200'>价格异常监控</div>
                <div className='text-xs text-gray-500'>当价格偏离正常范围时发出警告</div>
              </div>
              <button className='px-3 py-1.5 text-xs bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors'>
                已启用
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
