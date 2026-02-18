'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function PriceActions({ priceId }: { priceId: number }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const deletePrice = async () => {
    if (!confirm('确定删除该价格记录？')) return
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/prices/${priceId}`, { method: 'DELETE' })
      if (res.ok) router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='flex items-center justify-end gap-2'>
      <a
        href={`/admin/prices/${priceId}/edit`}
        className='px-2 py-1 text-xs text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded transition-colors'
      >
        编辑
      </a>
      <button
        onClick={deletePrice}
        disabled={loading}
        className='px-2 py-1 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition-colors disabled:opacity-50'
      >
        删除
      </button>
    </div>
  )
}
