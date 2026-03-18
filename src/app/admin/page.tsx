// Admin 后台管理首页

export default function AdminDashboard() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      <h1 className="text-3xl font-bold">管理后台</h1>

      <div className="grid md:grid-cols-3 gap-4">
        <a href="/admin/sites" className="bg-gray-900 border border-gray-800 rounded-lg p-6 hover:border-blue-700">
          <h2 className="text-xl font-bold">站点管理</h2>
          <p className="text-sm text-gray-400 mt-2">审核、编辑、上下架中转站</p>
        </a>
        <a href="/admin/health" className="bg-gray-900 border border-gray-800 rounded-lg p-6 hover:border-blue-700">
          <h2 className="text-xl font-bold">健康监控</h2>
          <p className="text-sm text-gray-400 mt-2">查看所有站点的健康检查结果</p>
        </a>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4">今日概览</h2>
        <div className="grid grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-blue-400">447</div>
            <div className="text-xs text-gray-500">收录站点</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-400">412</div>
            <div className="text-xs text-gray-500">在线</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-yellow-400">28</div>
            <div className="text-xs text-gray-500">不稳定</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-red-400">7</div>
            <div className="text-xs text-gray-500">已下线</div>
          </div>
        </div>
      </div>
    </div>
  )
}
