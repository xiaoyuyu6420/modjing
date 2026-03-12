type Props = {
  price: number
  unit?: string
  multiplier?: number
  className?: string
}

export default function PriceCell({ price, unit = 'per_million_tokens', multiplier = 1, className = '' }: Props) {
  const effective = price * (multiplier || 1)
  const unitLabel = unit === 'per_million_tokens' ? '/ 1M' : unit === 'per_thousand_tokens' ? '/ 1K' : `/ ${unit}`
  const showMul = multiplier && multiplier !== 1

  return (
    <span className={`mj-mono ${className}`}>
      <span className='text-stone-900'>¥{effective.toFixed(effective < 1 ? 4 : 2)}</span>
      <span className='ml-1 text-xs text-stone-400'>{unitLabel}</span>
      {showMul ? <span className='ml-1 text-[10px] text-stone-400'>(×{multiplier})</span> : null}
    </span>
  )
}
