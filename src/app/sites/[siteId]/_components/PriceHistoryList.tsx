type HistoryItem = {
  channelKey: string
  baseModel: string
  channelName: string
  price: number
  recordedAt: string
}

export function PriceHistoryList({ items }: { items: HistoryItem[] }) {
  if (items.length === 0) {
    return <div className='text-stone-400 text-sm'>暂无价格历史</div>
  }
  return (
    <div className='mj-table-wrap'>
      <table className='mj-table'>
        <thead>
          <tr>
            <th className='mj-th'>模型 / 渠道</th>
            <th className='mj-th text-right'>价格</th>
            <th className='mj-th'>时间</th>
          </tr>
        </thead>
        <tbody>
          {items.map((h, i) => (
            <tr key={i} className='mj-row'>
              <td className='mj-td'>
                <span className='text-stone-900'>{h.baseModel}</span>
                <span className='ml-2 text-xs text-stone-400'>{h.channelName}</span>
              </td>
              <td className='mj-td mj-mono text-stone-700 text-right'>
                ¥{h.price.toFixed(2)}
              </td>
              <td className='mj-td text-stone-400 text-xs'>
                {new Date(h.recordedAt).toLocaleString('zh-CN')}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
