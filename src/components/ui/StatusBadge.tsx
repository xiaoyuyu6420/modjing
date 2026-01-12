// owner: agent-B
type Props = { status: string }

const STYLES: Record<string, string> = {
  online: 'bg-green-900/50 text-green-400 border-green-800/50',
  unstable: 'bg-yellow-900/50 text-yellow-400 border-yellow-800/50',
  offline: 'bg-red-900/50 text-red-400 border-red-800/50',
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
    <span className={`inline-block px-2 py-0.5 rounded text-xs border ${style}`}>
      {label}
    </span>
  )
}
