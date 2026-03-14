type Props = { status: string }

const STYLES: Record<string, string> = {
  online: 'bg-brand-50 text-brand-700 border-brand-200',
  unstable: 'bg-amber-50 text-amber-700 border-amber-200',
  offline: 'bg-red-50 text-red-700 border-red-200',
}

const LABELS: Record<string, string> = {
  online: '在线',
  unstable: '不稳定',
  offline: '离线',
}

export function StatusBadge({ status }: Props) {
  const style = STYLES[status] ?? STYLES.online
  const label = LABELS[status] ?? status
  return (
    <span className={`mj-badge ${style}`}>
      <span className='h-1.5 w-1.5 rounded-full bg-current opacity-70' />
      {label}
    </span>
  )
}
