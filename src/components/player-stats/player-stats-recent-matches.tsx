import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import type { PlayerStatsOutput } from './types'

type Props = {
  matches: PlayerStatsOutput['recentMatches']
}

export function PlayerStatsRecentMatches({ matches }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent matches</CardTitle>
        <CardDescription>Latest completed games involving your teams</CardDescription>
      </CardHeader>
      <CardContent>
        {matches.length === 0 ? (
          <p className='text-sm text-muted-foreground text-center py-8'>
            No completed matches yet. Enter a tournament and play some games!
          </p>
        ) : (
          <ul className='space-y-3'>
            {matches.map((m) => (
              <li key={m.id} className='rounded-lg border p-3 text-sm space-y-2'>
                <div className='flex items-center justify-between gap-2 flex-wrap'>
                  <div className='flex items-center gap-2 min-w-0 flex-wrap'>
                    <Link
                      href={`/tournaments/${m.tournamentId}`}
                      className='font-medium text-primary hover:underline truncate'
                    >
                      {m.tournamentName}
                    </Link>
                    <Badge variant='outline' className='shrink-0 gap-1.5 font-normal pl-1.5'>
                      <Avatar className='h-4 w-4 rounded-sm'>
                        <AvatarImage src={m.gameIcon ?? undefined} />
                        <AvatarFallback className='rounded-sm text-[9px] leading-none'>
                          {m.gameName.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span>{m.gameName}</span>
                    </Badge>
                  </div>
                  {m.result !== 'unknown' && (
                    <Badge variant={m.result === 'win' ? 'default' : 'secondary'}>
                      {m.result === 'win' ? 'Win' : 'Loss'} · {m.yourTeamName}
                    </Badge>
                  )}
                </div>
                <div className='flex items-center justify-between gap-2 text-muted-foreground'>
                  <span className='truncate'>{m.homeTeam.name}</span>
                  <span className='font-mono font-bold text-foreground shrink-0'>
                    {m.homeScore ?? 0} – {m.awayScore ?? 0}
                  </span>
                  <span className='truncate text-right'>{m.awayTeam.name}</span>
                </div>
                {m.completedAt && (
                  <p className='text-xs text-muted-foreground'>
                    {new Date(m.completedAt).toLocaleString()}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
