'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { Medal } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { trpc } from '@/lib/trpc/client'
import { PlayerStatsKpiGrid, PlayerStatsHighlights } from './player-stats-kpi-grid'
import { PlayerStatsWinRateChart } from './player-stats-win-rate-chart'
import { PlayerStatsActivityChart } from './player-stats-activity-chart'
import { PlayerStatsBreakdownChart } from './player-stats-breakdown-chart'
import { PlayerStatsFormStrip } from './player-stats-form-strip'
import { PlayerStatsRecentMatches } from './player-stats-recent-matches'
import { PlayerStatsEmptyState } from './player-stats-empty-state'
import { RANGE_OPTIONS, type StatsRange } from './types'

export function PlayerStatsPage() {
  const { data: session, status } = useSession({ required: true })
  const [range, setRange] = useState<StatsRange>('all')
  const [gameId, setGameId] = useState<string | 'all'>('all')

  const { data: baseStats } = trpc.user.getPlayerStats.useQuery(
    { range },
    { enabled: !!session, staleTime: 60_000 },
  )

  const { data: stats, isLoading } = trpc.user.getPlayerStats.useQuery(
    {
      range,
      gameId: gameId === 'all' ? undefined : gameId,
    },
    {
      enabled: !!session,
      staleTime: 60_000,
    },
  )

  if (status === 'loading' || !session) {
    return (
      <div className='space-y-6'>
        <Skeleton className='h-10 w-64' />
        <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className='h-28' />
          ))}
        </div>
        <div className='grid gap-6 lg:grid-cols-2'>
          <Skeleton className='h-72' />
          <Skeleton className='h-72' />
        </div>
      </div>
    )
  }

  const s = stats?.summary
  const hasTeams = (s?.teamsCount ?? 0) > 0
  const showGameFilter = (baseStats?.byGame.length ?? 0) > 1

  return (
    <div className='space-y-8'>
      <div className='flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight flex items-center gap-2'>
            <Medal className='h-8 w-8 text-primary' />
            Player stats
          </h1>
          <p className='text-muted-foreground mt-1'>
            Match history and performance across teams you&apos;re on
          </p>
        </div>

        {hasTeams && (
          <div className='flex flex-wrap gap-3'>
            <Select value={range} onValueChange={(v) => setRange(v as StatsRange)}>
              <SelectTrigger className='w-[160px]'>
                <SelectValue placeholder='Time range' />
              </SelectTrigger>
              <SelectContent>
                {RANGE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {showGameFilter && (
              <Select value={gameId} onValueChange={setGameId}>
                <SelectTrigger className='w-[160px]'>
                  <SelectValue placeholder='All games' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All games</SelectItem>
                  {baseStats?.byGame.map((g) => (
                    <SelectItem key={g.gameId} value={g.gameId}>
                      {g.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        )}
      </div>

      {isLoading || !s ? (
        <div className='space-y-6'>
          <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6'>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className='h-28' />
            ))}
          </div>
          <div className='grid gap-6 lg:grid-cols-2'>
            <Skeleton className='h-72' />
            <Skeleton className='h-72' />
          </div>
        </div>
      ) : !hasTeams ? (
        <PlayerStatsEmptyState />
      ) : (
        <>
          <PlayerStatsKpiGrid summary={s} currentStreak={stats.currentStreak} />
          <PlayerStatsHighlights summary={s} />

          <div className='grid gap-6 lg:grid-cols-2'>
            <PlayerStatsWinRateChart data={stats.winRateOverTime} />
            <PlayerStatsActivityChart data={stats.matchesOverTime} />
          </div>

          <div className='grid gap-6 lg:grid-cols-2'>
            <PlayerStatsBreakdownChart
              title='By game'
              description='Win rate per title'
              rows={stats.byGame.map((g) => ({
                id: g.gameId,
                name: g.name,
                played: g.played,
                wins: g.wins,
                losses: g.losses,
                winRate: g.winRate,
              }))}
            />
            <PlayerStatsBreakdownChart
              title='By team'
              description='Win rate per roster'
              rows={stats.byTeam.map((t) => ({
                id: t.teamId,
                name: t.name,
                played: t.played,
                wins: t.wins,
                losses: t.losses,
                winRate: t.winRate,
              }))}
            />
          </div>

          <div className='grid gap-6 lg:grid-cols-2'>
            <PlayerStatsFormStrip form={stats.form} />
            <PlayerStatsRecentMatches matches={stats.recentMatches} />
          </div>
        </>
      )}
    </div>
  )
}
