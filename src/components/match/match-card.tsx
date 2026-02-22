import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Calendar, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MatchCardProps {
  match: {
    id: string
    round: number
    matchNumber: number
    scheduledAt?: Date | null
    status: string
    team1?: {
      id: string
      name: string
      logo?: string | null
    } | null
    team2?: {
      id: string
      name: string
      logo?: string | null
    } | null
    team1Score: number
    team2Score: number
    winnerId?: string | null
  }
  onClick?: () => void
  compact?: boolean
}

const statusConfig = {
  SCHEDULED: {
    label: 'Scheduled',
    className: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  },
  IN_PROGRESS: {
    label: 'Live',
    className: 'bg-red-500/10 text-red-500 border-red-500/20 animate-pulse',
  },
  COMPLETED: {
    label: 'Completed',
    className: 'bg-green-500/10 text-green-500 border-green-500/20',
  },
  DISPUTED: {
    label: 'Disputed',
    className: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  },
  CANCELLED: {
    label: 'Cancelled',
    className: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
  },
}

export function MatchCard({ match, onClick, compact = false }: MatchCardProps) {
  const status = statusConfig[match.status as keyof typeof statusConfig] || statusConfig.SCHEDULED
  const team1Won = match.winnerId === match.team1?.id
  const team2Won = match.winnerId === match.team2?.id

  if (compact) {
    // Compact version for bracket view
    return (
      <div
        onClick={onClick}
        className={cn(
          'relative w-full bg-card border border-border rounded-md p-2 space-y-1',
          onClick && 'cursor-pointer hover:border-primary/50 transition-colors'
        )}
      >
        {/* Team 1 */}
        <div
          className={cn(
            'flex items-center justify-between text-sm',
            team1Won && 'font-bold text-primary'
          )}
        >
          <span className='flex-1 truncate'>
            {match.team1?.name || 'TBD'}
          </span>
          <span className={cn('ml-2 font-mono', team1Won && 'text-primary')}>
            {match.status === 'COMPLETED' ? match.team1Score : '-'}
          </span>
        </div>

        {/* Team 2 */}
        <div
          className={cn(
            'flex items-center justify-between text-sm',
            team2Won && 'font-bold text-primary'
          )}
        >
          <span className='flex-1 truncate'>
            {match.team2?.name || 'TBD'}
          </span>
          <span className={cn('ml-2 font-mono', team2Won && 'text-primary')}>
            {match.status === 'COMPLETED' ? match.team2Score : '-'}
          </span>
        </div>

        {/* Status indicator */}
        {match.status === 'IN_PROGRESS' && (
          <div className='absolute -top-1 -right-1 h-3 w-3 rounded-full bg-red-500 animate-pulse' />
        )}
      </div>
    )
  }

  // Full card version
  return (
    <Card
      onClick={onClick}
      className={cn(
        'relative overflow-hidden hover:border-primary/50 transition-all duration-300',
        onClick && 'cursor-pointer glow-purple-hover'
      )}
    >
      <CardContent className='p-6 space-y-4'>
        {/* Header */}
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-2 text-sm text-muted-foreground'>
            <span className='font-mono'>Round {match.round}</span>
            <span>•</span>
            <span className='font-mono'>Match {match.matchNumber}</span>
          </div>
          <Badge className={cn('border', status.className)}>
            {status.label}
          </Badge>
        </div>

        {/* Teams */}
        <div className='space-y-3'>
          {/* Team 1 */}
          <div
            className={cn(
              'flex items-center justify-between p-3 rounded-lg border transition-colors',
              team1Won
                ? 'border-primary bg-primary/5'
                : 'border-border bg-card'
            )}
          >
            <div className='flex items-center gap-3 flex-1 min-w-0'>
              <Avatar className='h-10 w-10'>
                <AvatarFallback className='bg-gradient-purple text-white'>
                  {match.team1?.name?.charAt(0) || '?'}
                </AvatarFallback>
              </Avatar>
              <span
                className={cn(
                  'font-medium truncate',
                  team1Won && 'text-primary font-bold'
                )}
              >
                {match.team1?.name || 'TBD'}
              </span>
            </div>
            <span
              className={cn(
                'text-2xl font-bold font-mono ml-4',
                team1Won && 'text-primary'
              )}
            >
              {match.status === 'COMPLETED' || match.status === 'IN_PROGRESS'
                ? match.team1Score
                : '-'}
            </span>
          </div>

          {/* VS Divider */}
          <div className='flex items-center justify-center'>
            <div className='text-xs font-bold text-muted-foreground bg-muted px-3 py-1 rounded-full'>
              VS
            </div>
          </div>

          {/* Team 2 */}
          <div
            className={cn(
              'flex items-center justify-between p-3 rounded-lg border transition-colors',
              team2Won
                ? 'border-primary bg-primary/5'
                : 'border-border bg-card'
            )}
          >
            <div className='flex items-center gap-3 flex-1 min-w-0'>
              <Avatar className='h-10 w-10'>
                <AvatarFallback className='bg-gradient-cyan text-white'>
                  {match.team2?.name?.charAt(0) || '?'}
                </AvatarFallback>
              </Avatar>
              <span
                className={cn(
                  'font-medium truncate',
                  team2Won && 'text-primary font-bold'
                )}
              >
                {match.team2?.name || 'TBD'}
              </span>
            </div>
            <span
              className={cn(
                'text-2xl font-bold font-mono ml-4',
                team2Won && 'text-primary'
              )}
            >
              {match.status === 'COMPLETED' || match.status === 'IN_PROGRESS'
                ? match.team2Score
                : '-'}
            </span>
          </div>
        </div>

        {/* Footer */}
        {match.scheduledAt && (
          <div className='flex items-center gap-4 text-sm text-muted-foreground pt-2 border-t border-border'>
            <div className='flex items-center gap-2'>
              <Calendar className='h-4 w-4' />
              <span>
                {new Date(match.scheduledAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            </div>
            <div className='flex items-center gap-2'>
              <Clock className='h-4 w-4' />
              <span>
                {new Date(match.scheduledAt).toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
