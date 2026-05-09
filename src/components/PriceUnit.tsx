'use client'

import { useState, createContext, useContext, ReactNode } from 'react'

type Unit = 'M' | 'K'

const UnitContext = createContext<{
  unit: Unit
  setUnit: (u: Unit) => void
  fmt: (price: number | null | undefined) => string
}>({
  unit: 'M',
  setUnit: () => {},
  fmt: () => '-',
})

export function usePriceUnit() {
  return useContext(UnitContext)
}

export function PriceUnitProvider({ children }: { children: ReactNode }) {
  const [unit, setUnit] = useState<Unit>('M')

  const fmt = (price: number | null | undefined): string => {
    if (price == null || price <= 0) return '-'
    const val = unit === 'K' ? price / 1000 : price
    return unit === 'K'
      ? val < 0.01 ? `¥${val.toFixed(4)}` : `¥${val.toFixed(3)}`
      : val < 1 ? `¥${val.toFixed(4)}` : `¥${val.toFixed(2)}`
  }

  return (
    <UnitContext.Provider value={{ unit, setUnit, fmt }}>
      {children}
    </UnitContext.Provider>
  )
}

export function PriceUnitToggle() {
  const { unit, setUnit } = usePriceUnit()
  return (
    <div className='inline-flex items-center gap-1 rounded-lg border border-stone-200 bg-white p-0.5 text-xs font-medium'>
      <button
        onClick={() => setUnit('M')}
        className={`px-2 py-1 rounded-md transition-colors ${
          unit === 'M' ? 'bg-stone-800 text-white' : 'text-stone-500 hover:text-stone-800'
        }`}
      >
        /M
      </button>
      <button
        onClick={() => setUnit('K')}
        className={`px-2 py-1 rounded-md transition-colors ${
          unit === 'K' ? 'bg-stone-800 text-white' : 'text-stone-500 hover:text-stone-800'
        }`}
      >
        /K
      </button>
    </div>
  )
}

export function PriceWithUnit({ price, className }: { price: number | null | undefined; className?: string }) {
  const { fmt } = usePriceUnit()
  return <span className={className}>{fmt(price)}</span>
}

export function PriceHint() {
  const { unit } = usePriceUnit()
  return <span className='text-[10px] text-stone-400 ml-1'>/{unit === 'M' ? '1M' : '1K'} tokens</span>
}
