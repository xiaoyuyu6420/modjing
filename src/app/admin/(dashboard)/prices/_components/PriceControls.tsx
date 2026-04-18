'use client'

import Link from 'next/link'
import { useTransition } from 'react'
import { setPriceFlag } from '../actions'

export default function PriceFlagToggle({
  id,
  field,
  checked,
  labelOn,
  labelOff,
}: {
  id: number
  field: 'tampered' | 'priceAnomaly'
  checked: boolean
  labelOn: string
  labelOff: string
}) {
  const [, start] = useTransition()
  return (
    <button
      type='button'
      onClick={() => start(() => setPriceFlag(id, field, !checked))}
      className={`mj-badge cursor-pointer ${
        checked
          ? 'border-red-200 bg-red-50 text-red-600'
          : 'border-stone-200 bg-stone-50 text-stone-400'
      }`}
    >
      {checked ? labelOn : labelOff}
    </button>
  )
}

export function PriceEditLink({ id }: { id: number }) {
  return (
    <Link href={`/admin/prices/${id}`} className='text-xs text-brand-600 hover:text-brand-700'>
      编辑
    </Link>
  )
}
