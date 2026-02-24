'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function ReviewActions({ reviewId }: { reviewId: number }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const deleteReview = async () => {
    if (!confirm('确定删除该评价？')) return
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/reviews/${reviewId}`, { method: 'DELETE' })
      if (res.ok) router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={deleteReview}
      disabled={loading}
      className='px-2.5 py-1 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition-colors disabled:opacity-50'
    >
      删除
    </button>
  )
}
