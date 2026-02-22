'use client'

import { MatchCard } from '@/components/match/match-card'
import { Trophy } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Match {
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

interface BracketViewProps {
  matches: Match[]
  tournamentFormat: 'SINGLE_ELIMINATION' | 'DOUBLE_ELIMINATION' | 'ROUND_ROBIN' | 'SWISS'
  onMatchClick?: (matchId: string) => void
}

export function BracketView({
  matches,
  tournamentFormat,
  onMatchClick,
}: BracketViewProps) {
  if (matches.length === 0) {
    return (
      <div className='flex flex-col items-center justify-center py-20 text-center'>
        <div className='rounded-full bg-muted p-6 mb-4'>
          <Trophy className='h-10 w-10 text-muted-foreground' />
        </div>
        <h3 className='text-lg font-semibold mb-2'>No bracket generated yet</h3>
        <p className='text-muted-foreground max-w-md'>
          The tournament bracket will be generated once registration closes and
          the tournament starts.
        </p>
      </div>
    )
  }

  if (tournamentFormat === 'ROUND_ROBIN' || tournamentFormat === 'SWISS') {
    // For round robin and swiss, show matches in a list grouped by round
    const matchesByRound = matches.reduce((acc, match) => {
      if (!acc[match.round]) {
        acc[match.round] = []
      }
      acc[match.round].push(match)
      return acc
    }, {} as Record<number, Match[]>)

    return (
      <div className='space-y-8'>
        {Object.entries(matchesByRound)
          .sort(([a], [b]) => parseInt(a) - parseInt(b))
          .map(([round, roundMatches]) => (
            <div key={round} className='space-y-4'>
              <h3 className='text-xl font-bold text-gradient-purple-cyan'>
                Round {round}
              </h3>
              <div className='grid gap-4 sm:grid-cols-2'>
                {roundMatches.map((match) => (
                  <MatchCard
                    key={match.id}
                    match={match}
                    onClick={() => onMatchClick?.(match.id)}
                  />
                ))}
              </div>
            </div>
          ))}
      </div>
    )
  }

  // Single/Double Elimination - Show as bracket
  const maxRound = Math.max(...matches.map((m) => m.round))
  const matchesByRound = matches.reduce((acc, match) => {
    if (!acc[match.round]) {
      acc[match.round] = []
    }
    acc[match.round].push(match)
    return acc
  }, {} as Record<number, Match[]>)

  return (
    <div className='overflow-x-auto pb-8'>
      <div className='inline-flex gap-8 min-w-full p-4'>
        {Array.from({ length: maxRound }, (_, i) => i + 1).map((round) => {
          const roundMatches = matchesByRound[round] || []
          const isFirst = round === 1
          const isFinal = round === maxRound

          return (
            <div key={round} className='flex flex-col justify-around min-w-[280px]'>
              {/* Round header */}
              <div className='mb-4 text-center'>
                <h3 className='text-lg font-bold text-gradient-purple-cyan'>
                  {isFinal
                    ? 'Finals'
                    : isFirst
                    ? `Round ${round}`
                    : `Round ${round}`}
                </h3>
                <p className='text-xs text-muted-foreground mt-1'>
                  {roundMatches.length} match{roundMatches.length !== 1 ? 'es' : ''}
                </p>
              </div>

              {/* Matches */}
              <div
                className={cn(
                  'flex flex-col gap-8',
                  'justify-around flex-1'
                )}
              >
                {roundMatches.map((match) => (
                  <div key={match.id} className='relative'>
                    <MatchCard
                      match={match}
                      compact
                      onClick={() => onMatchClick?.(match.id)}
                    />

                    {/* Connector line to next round (simplified) */}
                    {!isFinal && (
                      <div className='absolute left-full top-1/2 w-8 border-t-2 border-border' />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className='mt-8 flex items-center justify-center gap-6 text-sm text-muted-foreground'>
        <div className='flex items-center gap-2'>
          <div className='h-3 w-3 rounded-full bg-red-500 animate-pulse' />
          <span>Live</span>
        </div>
        <div className='flex items-center gap-2'>
          <div className='h-3 w-3 rounded-full bg-green-500' />
          <span>Completed</span>
        </div>
        <div className='flex items-center gap-2'>
          <div className='h-3 w-3 rounded-full bg-blue-500' />
          <span>Scheduled</span>
        </div>
      </div>
    </div>
  )
}
