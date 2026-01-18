// Admin 健康监控

export default function AdminHealth() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">健康监控</h1>
        <a href="/admin" className="text-blue-400 hover:text-blue-300">← 返回后台</a>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-gray-800 pb-4">
          <div>
            <div className="font-bold">PackyCode</div>
            <div className="text-sm text-gray-400">最后检查: 2分钟前</div>
          </div>
          <div className="text-right">
            <div className="text-green-400 font-bold">ok</div>
            <div className="text-sm text-gray-400"> latency: 245ms</div>
          </div>
        </div>
        <div className="flex items-center justify-between border-b border-gray-800 pb-4">
          <div>
            <div className="font-bold">RightCode</div>
            <div className="text-sm text-gray-400">最后检查: 5分钟前</div>
          </div>
          <div className="text-right">
            <div className="text-yellow-400 font-bold">slow</div>
            <div className="text-sm text-gray-400"> latency: 1200ms</div>
          </div>
        </div>
      </div>
    </div>
  )
}
