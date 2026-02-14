'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function SiteActions({
  siteId,
  currentStatus,
}: {
  siteId: number
  currentStatus: string
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const toggleStatus = async () => {
    const nextStatus = currentStatus === 'offline' ? 'online' : 'offline'
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/sites/${siteId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      })
      if (res.ok) router.refresh()
    } finally {
      setLoading(false)
    }
  }

  const deleteSite = async () => {
    if (!confirm('确定删除该站点？此操作不可撤销。')) return
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/sites/${siteId}`, { method: 'DELETE' })
      if (res.ok) router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='flex items-center justify-end gap-2'>
      <a
        href={`/admin/sites/${siteId}/edit`}
        className='px-2.5 py-1 text-xs text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded transition-colors'
      >
        编辑
      </a>
      <button
        onClick={toggleStatus}
        disabled={loading}
        className='px-2.5 py-1 text-xs text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/10 rounded transition-colors disabled:opacity-50'
      >
        {currentStatus === 'offline' ? '上架' : '下架'}
      </button>
      <button
        onClick={deleteSite}
        disabled={loading}
        className='px-2.5 py-1 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition-colors disabled:opacity-50'
      >
        删除
      </button>
    </div>
  )
}
