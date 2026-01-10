// owner: agent-B
type Props = { band: string | null | undefined }

const STYLES: Record<string, string> = {
  minimal: 'bg-green-900/50 text-green-400 border-green-800/50',
  low: 'bg-blue-900/50 text-blue-400 border-blue-800/50',
  light: 'bg-yellow-900/50 text-yellow-400 border-yellow-800/50',
  severe: 'bg-red-900/50 text-red-400 border-red-800/50',
}

const LABELS: Record<string, string> = {
  minimal: '极少',
  low: '少量',
  light: '轻度',
  severe: '严重',
}

export function FakeBandTag({ band }: Props) {
  if (!band) {
    return (
      <span className='inline-block px-2 py-0.5 rounded text-xs border border-gray-800 bg-gray-900/50 text-gray-500'>
        未探测
      </span>
    )
  }
  const style = STYLES[band] ?? 'bg-gray-900/50 text-gray-400 border-gray-800'
  const label = LABELS[band] ?? band
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs border ${style}`}>
      {label}
    </span>
  )
}
