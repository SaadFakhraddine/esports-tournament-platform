'use client'

import { cn } from '@/lib/utils'
import { Trophy } from 'lucide-react'

interface Team {
  id: string
  name: string
  tag?: string | null
  logo?: string | null
}

interface Match {
  id: string
  round: number
  matchNumber: number
  scheduledAt?: Date | null
  status: string
  homeTeam?: Team | null
  awayTeam?: Team | null
  homeScore: number | null
  awayScore: number | null
  winner?: Team | null
  winnerTeamId?: string | null
}

interface BracketTreeProps {
  matches: Match[]
  onMatchClick?: (matchId: string) => void
}

/**
 * Visual Tournament Bracket Tree Component
 * Displays matches in a traditional bracket tree layout with connecting lines
 * Matches the existing codebase style and patterns
 */
export function BracketTree({ matches, onMatchClick }: BracketTreeProps) {
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

  // Group matches by round
  const maxRound = Math.max(...matches.map((m) => m.round))
  const matchesByRound: Record<number, Match[]> = {}
  
  for (let i = 1; i <= maxRound; i++) {
    matchesByRound[i] = matches
      .filter((m) => m.round === i)
      .sort((a, b) => a.matchNumber - b.matchNumber)
  }

  // Calculate spacing
  const matchHeight = 120
  const verticalGap = 20
  const horizontalGap = 100

  return (
    <div className='w-full overflow-x-auto pb-8'>
      <div className='inline-flex relative min-w-full p-8'>
        {/* Render each round */}
        {Array.from({ length: maxRound }, (_, i) => i + 1).map((round) => {
          const roundMatches = matchesByRound[round] || []
          const isFirstRound = round === 1
          const isFinalRound = round === maxRound
          
          // Calculate vertical spacing for this round
          const spacingMultiplier = Math.pow(2, round - 1)
          const roundVerticalGap = verticalGap * spacingMultiplier
          const matchSpacing = matchHeight + roundVerticalGap

          return (
            <div
              key={round}
              className='relative'
              style={{
                marginLeft: round === 1 ? 0 : horizontalGap,
                minWidth: 280,
              }}
            >
              {/* Round Header */}
              <div className='mb-6 text-center'>
                <h3 className='text-lg font-bold text-gradient-purple-cyan'>
                  {isFinalRound
                    ? '🏆 Finals'
                    : isFirstRound
                    ? `Round ${round}`
                    : `Round ${round}`}
                </h3>
                <p className='text-xs text-muted-foreground mt-1'>
                  {roundMatches.length} match{roundMatches.length !== 1 ? 'es' : ''}
                </p>
              </div>

              {/* Matches */}
              <div className='relative space-y-0'>
                {roundMatches.map((match, matchIndex) => {
                  const homeTeamWon = match.winnerTeamId === match.homeTeam?.id || match.winner?.id === match.homeTeam?.id
                  const awayTeamWon = match.winnerTeamId === match.awayTeam?.id || match.winner?.id === match.awayTeam?.id
                  const isLive = match.status === 'IN_PROGRESS'
                  const isCompleted = match.status === 'COMPLETED'

                  return (
                    <div
                      key={match.id}
                      className='relative'
                      style={{
                        marginTop: matchIndex === 0 ? 0 : matchSpacing,
                        height: matchHeight,
                      }}
                    >
                      {/* Match Box */}
                      <div
                        onClick={() => onMatchClick?.(match.id)}
                        className={cn(
                          'relative w-full bg-card border-2 rounded-lg overflow-hidden transition-all duration-200',
                          onMatchClick && 'cursor-pointer hover:border-primary hover:shadow-lg hover:shadow-primary/20',
                          isLive && 'border-red-500 shadow-lg shadow-red-500/20',
                          isCompleted && 'border-green-500/50',
                          !isLive && !isCompleted && 'border-border'
                        )}
                        style={{ height: matchHeight }}
                      >
                        {/* Live Indicator */}
                        {isLive && (
                          <div className='absolute top-2 right-2 flex items-center gap-1.5 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full animate-pulse'>
                            <div className='h-2 w-2 rounded-full bg-white' />
                            LIVE
                          </div>
                        )}

                        {/* Home Team */}
                        <div
                          className={cn(
                            'flex items-center justify-between px-4 py-3 border-b transition-colors',
                            homeTeamWon && isCompleted
                              ? 'bg-primary/10 border-primary/30'
                              : 'border-border'
                          )}
                        >
                          <div className='flex items-center gap-2 flex-1 min-w-0'>
                            {/* Team Logo/Initial */}
                            <div
                              className={cn(
                                'flex items-center justify-center h-8 w-8 rounded-full text-xs font-bold flex-shrink-0',
                                homeTeamWon
                                  ? 'bg-gradient-purple text-white'
                                  : 'bg-muted text-muted-foreground'
                              )}
                            >
                              {match.homeTeam?.name?.charAt(0) || '?'}
                            </div>
                            
                            {/* Team Name */}
                            <div className='flex-1 min-w-0'>
                              <p
                                className={cn(
                                  'text-sm truncate',
                                  homeTeamWon && isCompleted
                                    ? 'font-bold text-primary'
                                    : 'font-medium'
                                )}
                              >
                                {match.homeTeam?.name || 'TBD'}
                              </p>
                              {match.homeTeam?.tag && (
                                <p className='text-xs text-muted-foreground truncate'>
                                  [{match.homeTeam.tag}]
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Score */}
                          <span
                            className={cn(
                              'text-lg font-bold font-mono ml-3 flex-shrink-0',
                              homeTeamWon && isCompleted && 'text-primary'
                            )}
                          >
                            {isCompleted || isLive ? match.homeScore ?? '-' : '-'}
                          </span>
                        </div>

                        {/* Away Team */}
                        <div
                          className={cn(
                            'flex items-center justify-between px-4 py-3 transition-colors',
                            awayTeamWon && isCompleted
                              ? 'bg-primary/10'
                              : ''
                          )}
                        >
                          <div className='flex items-center gap-2 flex-1 min-w-0'>
                            {/* Team Logo/Initial */}
                            <div
                              className={cn(
                                'flex items-center justify-center h-8 w-8 rounded-full text-xs font-bold flex-shrink-0',
                                awayTeamWon
                                  ? 'bg-gradient-cyan text-white'
                                  : 'bg-muted text-muted-foreground'
                              )}
                            >
                              {match.awayTeam?.name?.charAt(0) || '?'}
                            </div>
                            
                            {/* Team Name */}
                            <div className='flex-1 min-w-0'>
                              <p
                                className={cn(
                                  'text-sm truncate',
                                  awayTeamWon && isCompleted
                                    ? 'font-bold text-primary'
                                    : 'font-medium'
                                )}
                              >
                                {match.awayTeam?.name || 'TBD'}
                              </p>
                              {match.awayTeam?.tag && (
                                <p className='text-xs text-muted-foreground truncate'>
                                  [{match.awayTeam.tag}]
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Score */}
                          <span
                            className={cn(
                              'text-lg font-bold font-mono ml-3 flex-shrink-0',
                              awayTeamWon && isCompleted && 'text-primary'
                            )}
                          >
                            {isCompleted || isLive ? match.awayScore ?? '-' : '-'}
                          </span>
                        </div>

                        {/* Match Number Badge */}
                        <div className='absolute bottom-1 left-1/2 -translate-x-1/2'>
                          <span className='text-[10px] text-muted-foreground font-mono bg-muted px-2 py-0.5 rounded-full'>
                            M{match.matchNumber}
                          </span>
                        </div>
                      </div>

                      {/* Connector Lines to Next Round */}
                      {!isFinalRound && (
                        <>
                          {/* Horizontal line going right */}
                          <div
                            className='absolute border-t-2 border-border'
                            style={{
                              left: '100%',
                              top: matchHeight / 2,
                              width: horizontalGap / 2,
                            }}
                          />

                          {/* Vertical connector line */}
                          {matchIndex % 2 === 0 && matchIndex + 1 < roundMatches.length && (
                            <div
                              className='absolute border-l-2 border-border'
                              style={{
                                left: `calc(100% + ${horizontalGap / 2}px)`,
                                top: matchHeight / 2,
                                height: matchSpacing,
                              }}
                            />
                          )}

                          {/* Horizontal line connecting to vertical line */}
                          {matchIndex % 2 === 1 && (
                            <div
                              className='absolute border-t-2 border-border'
                              style={{
                                left: `calc(100% + ${horizontalGap / 2}px)`,
                                top: matchHeight / 2,
                                width: horizontalGap / 2,
                              }}
                            />
                          )}
                        </>
                      )}

                      {/* Trophy for finals winner */}
                      {isFinalRound && isCompleted && (homeTeamWon || awayTeamWon) && (
                        <div className='absolute -right-12 top-1/2 -translate-y-1/2'>
                          <div className='flex items-center justify-center h-10 w-10 rounded-full bg-gradient-purple shadow-lg'>
                            <Trophy className='h-6 w-6 text-white' />
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className='mt-8 flex items-center justify-center gap-6 text-sm text-muted-foreground border-t border-border pt-6'>
        <div className='flex items-center gap-2'>
          <div className='h-3 w-3 rounded-full bg-red-500 animate-pulse' />
          <span>Live Match</span>
        </div>
        <div className='flex items-center gap-2'>
          <div className='h-3 w-3 rounded-full bg-green-500' />
          <span>Completed</span>
        </div>
        <div className='flex items-center gap-2'>
          <div className='h-3 w-3 rounded-full bg-blue-500' />
          <span>Scheduled</span>
        </div>
        <div className='flex items-center gap-2'>
          <Trophy className='h-3 w-3 text-primary' />
          <span>Champion</span>
        </div>
      </div>
    </div>
  )
}
