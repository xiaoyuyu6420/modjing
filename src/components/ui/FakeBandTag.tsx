type Props = { band: string | null | undefined }

const STYLES: Record<string, string> = {
  minimal: 'bg-brand-50 text-brand-700 border-brand-200',
  low: 'bg-sky-50 text-sky-700 border-sky-200',
  light: 'bg-amber-50 text-amber-700 border-amber-200',
  severe: 'bg-red-50 text-red-700 border-red-200',
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
      <span className='mj-badge bg-stone-50 text-stone-400 border-stone-200'>未探测</span>
    )
  }
  const style = STYLES[band] ?? 'bg-stone-50 text-stone-500 border-stone-200'
  const label = LABELS[band] ?? band
  return <span className={`mj-badge ${style}`}>{label}</span>
}
