// owner: agent-C

type Props = {
  price: number
  unit?: string
  multiplier?: number
  className?: string
}

export default function PriceCell({ price, unit = 'per_million_tokens', multiplier = 1, className = '' }: Props) {
  const effective = price * (multiplier || 1)
  const unitLabel = unit === 'per_million_tokens' ? '/ 1M tokens' : unit === 'per_thousand_tokens' ? '/ 1K tokens' : `/ ${unit}`
  const showMul = multiplier && multiplier !== 1

  return (
    <span className={`tabular-nums ${className}`}>
      <span className='text-gray-100'>¥{effective.toFixed(effective < 1 ? 4 : 2)}</span>
      <span className='ml-1 text-xs text-gray-500'>{unitLabel}</span>
      {showMul ? <span className='ml-1 text-[10px] text-gray-600'>(×{multiplier})</span> : null}
    </span>
  )
}
