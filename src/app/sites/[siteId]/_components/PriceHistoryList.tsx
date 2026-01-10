type HistoryItem = {
  channelKey: string
  baseModel: string
  channelName: string
  price: number
  recordedAt: string
}

export function PriceHistoryList({ items }: { items: HistoryItem[] }) {
  if (items.length === 0) {
    return (
      <div className='text-gray-500 text-sm'>暂无价格历史</div>
    )
  }
  return (
    <div className='border border-gray-800 rounded-lg overflow-hidden'>
      <table className='w-full text-sm'>
        <thead className='bg-gray-900/60'>
          <tr className='text-left text-gray-400 text-xs'>
            <th className='py-2 px-3 font-medium'>模型 / 渠道</th>
            <th className='py-2 px-3 font-medium'>价格</th>
            <th className='py-2 px-3 font-medium'>时间</th>
          </tr>
        </thead>
        <tbody>
          {items.map((h, i) => (
            <tr key={i} className='border-t border-gray-800/60'>
              <td className='py-2 px-3 text-gray-300'>
                <span className='text-gray-200'>{h.baseModel}</span>
                <span className='ml-2 text-xs text-gray-500'>{h.channelName}</span>
              </td>
              <td className='py-2 px-3 font-mono text-gray-300'>
                ¥{h.price.toFixed(2)}
              </td>
              <td className='py-2 px-3 text-gray-500 text-xs'>
                {new Date(h.recordedAt).toLocaleString('zh-CN')}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
