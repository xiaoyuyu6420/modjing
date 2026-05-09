'use client'

/**
 * 24 次探测的在线状态序列可视化
 * hvoy 的 recentOnlineSeq 是 24 个字符，'1'=在线 '0'=离线
 */
export function OnlineSeqBar({ seq, className }: { seq: string | null; className?: string }) {
  if (!seq || seq.length === 0) {
    return <span className={`text-stone-300 text-xs ${className ?? ''}`}>-</span>
  }

  const cells = seq.split('').slice(-24)
  const onlineCount = cells.filter((c) => c === '1').length

  return (
    <div className={`inline-flex items-center gap-2 ${className ?? ''}`}>
      <div className='flex gap-[2px]'>
        {cells.map((c, i) => (
          <span
            key={i}
            className={`w-[3px] h-3 rounded-[1px] ${
              c === '1' ? 'bg-brand-500' : 'bg-stone-200'
            }`}
            title={c === '1' ? '在线' : '离线'}
          />
        ))}
      </div>
      <span className='text-[10px] text-stone-400 mj-mono'>{onlineCount}/{cells.length}</span>
    </div>
  )
}

/**
 * Token 使用比率
 * hvoy 的 tokenUsageRatio: 实际返回 token / 请求 token
 * < 0.9 说明可能掺水（返回的 token 不够）
 * 显示为百分比
 */
export function TokenUsageCell({ ratio }: { ratio: number | null }) {
  if (ratio == null) return <span className='text-stone-300'>-</span>

  const pct = (ratio * 100).toFixed(1)
  const color =
    ratio >= 0.95 ? 'text-brand-600' : ratio >= 0.85 ? 'text-amber-600' : 'text-red-600'

  return <span className={`mj-mono ${color}`}>{pct}%</span>
}
