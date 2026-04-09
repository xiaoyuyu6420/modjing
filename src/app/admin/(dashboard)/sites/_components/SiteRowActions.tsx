'use client'

import Link from 'next/link'
import { useTransition } from 'react'
import { deleteSite, setSiteStatus } from '../actions'

export default function SiteRowActions({ id, status }: { id: number; status: string }) {
  const [pending, start] = useTransition()
  return (
    <div className='flex items-center gap-2 justify-end'>
      <select
        defaultValue={status}
        disabled={pending}
        onChange={(e) => start(() => setSiteStatus(id, e.target.value))}
        className='mj-select py-1 text-xs w-[88px]'
        aria-label='状态'
      >
        <option value='online'>在线</option>
        <option value='unstable'>不稳定</option>
        <option value='offline'>离线</option>
      </select>
      <Link href={`/admin/sites/${id}`} className='text-xs text-brand-600 hover:text-brand-700'>
        编辑
      </Link>
      <button
        onClick={() => {
          if (confirm('确认删除该站点？相关价格/评价/公告会一并删除。')) {
            start(() => deleteSite(id))
          }
        }}
        className='text-xs text-red-600 hover:text-red-700 disabled:opacity-50'
        disabled={pending}
      >
        删除
      </button>
    </div>
  )
}
