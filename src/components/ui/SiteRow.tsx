// owner: agent-C
import Link from 'next/link'

type Props = {
  siteId: number
  siteName: string
  channel?: string
  url?: string
}

export default function SiteRow({ siteId, siteName, channel, url }: Props) {
  return (
    <div className='flex items-center gap-2'>
      <Link href={`/sites/${siteId}`} className='font-medium text-gray-100 hover:text-blue-400 transition-colors'>
        {siteName}
      </Link>
      {channel ? <span className='text-xs text-gray-500'>· {channel}</span> : null}
      {url ? <span className='text-xs text-gray-600 hidden md:inline'>{url.replace(/^https?:\/\//, '')}</span> : null}
    </div>
  )
}
