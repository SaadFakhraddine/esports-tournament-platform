import { formatDistanceToNow } from 'date-fns'

export function ActivityItem({
  action,
  team,
  timestamp,
}: {
  action: string
  team: string
  timestamp: Date | string
}) {
  const date = timestamp instanceof Date ? timestamp : new Date(timestamp)
  const time = formatDistanceToNow(date, { addSuffix: true })

  return (
    <div className='flex items-center justify-between py-2 border-b last:border-0'>
      <div>
        <p className='text-sm font-medium'>{action}</p>
        <p className='text-xs text-muted-foreground'>{team}</p>
      </div>
      <span className='text-xs text-muted-foreground'>{time}</span>
    </div>
  )
}
