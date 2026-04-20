'use client'

import { useTransition } from 'react'

type Props = {
  action: () => Promise<void>
  label?: string
  message?: string
  className?: string
}

export default function ConfirmDelete({
  action,
  label = '删除',
  message = '确认删除？此操作不可撤销。',
  className = 'mj-btn-danger',
}: Props) {
  const [pending, start] = useTransition()
  return (
    <button
      type='button'
      disabled={pending}
      onClick={() => {
        if (window.confirm(message)) start(action)
      }}
      className={className}
    >
      {pending ? '删除中…' : label}
    </button>
  )
}
