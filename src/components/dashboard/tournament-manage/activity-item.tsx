export function ActivityItem({ action, team, time }: { action: string; team: string; time: string }) {
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
