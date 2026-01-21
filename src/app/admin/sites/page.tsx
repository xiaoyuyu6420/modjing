// Admin 站点管理

export default function AdminSites() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">站点管理</h1>
        <a href="/admin" className="text-blue-400 hover:text-blue-300">← 返回后台</a>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-800 text-gray-300">
            <tr>
              <th className="px-4 py-3 text-left">站点名称</th>
              <th className="px-4 py-3 text-left">URL</th>
              <th className="px-4 py-3 text-left">状态</th>
              <th className="px-4 py-3 text-left">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            <tr>
              <td className="px-4 py-3">PackyCode</td>
              <td className="px-4 py-3 text-gray-400">packyapi.com</td>
              <td className="px-4 py-3"><span className="text-green-400">online</span></td>
              <td className="px-4 py-3 space-x-2">
                <button className="text-blue-400 hover:text-blue-300">编辑</button>
                <button className="text-red-400 hover:text-red-300">下架</button>
              </td>
            </tr>
            <tr>
              <td className="px-4 py-3">RightCode</td>
              <td className="px-4 py-3 text-gray-400">rightcode.ai</td>
              <td className="px-4 py-3"><span className="text-green-400">online</span></td>
              <td className="px-4 py-3 space-x-2">
                <button className="text-blue-400 hover:text-blue-300">编辑</button>
                <button className="text-red-400 hover:text-red-300">下架</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
