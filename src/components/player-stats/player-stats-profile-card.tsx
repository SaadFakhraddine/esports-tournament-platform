'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { BarChart3, Target, Trophy, Users } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { trpc } from '@/lib/trpc/client'
import { PlayerStatsWinRateChart } from './player-stats-win-rate-chart'

export function PlayerStatsProfileCard() {
  const { data: stats, isLoading } = trpc.user.getPlayerStats.useQuery(
    { range: 'all' },
    { staleTime: 60_000 },
  )

  const s = stats?.summary

  return (
    <Card>
      <CardHeader className='flex flex-row items-center justify-between space-y-0'>
        <CardTitle className='text-base'>Statistics</CardTitle>
        <Link
          href='/dashboard/stats'
          className='text-xs text-primary hover:underline font-medium'
        >
          View full stats →
        </Link>
      </CardHeader>
      <CardContent className='space-y-4'>
        {isLoading || !s ? (
          <div className='space-y-3'>
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className='h-5 w-full' />
            ))}
          </div>
        ) : (
          <>
            <div className='space-y-3'>
              <StatRow icon={<Target className='h-4 w-4' />} label='Win rate' value={`${s.winRate}%`} />
              <StatRow
                icon={<BarChart3 className='h-4 w-4' />}
                label='Matches played'
                value={String(s.completedMatches)}
              />
              <StatRow icon={<Users className='h-4 w-4' />} label='Teams' value={String(s.teamsCount)} />
              <StatRow
                icon={<Trophy className='h-4 w-4' />}
                label='Active tournaments'
                value={String(s.activeTournamentsCount)}
              />
            </div>
            {stats.winRateOverTime.length >= 2 && (
              <PlayerStatsWinRateChart data={stats.winRateOverTime} compact />
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}

function StatRow({
  icon,
  label,
  value,
}: {
  icon: ReactNode
  label: string
  value: string
}) {
  return (
    <div className='flex items-center justify-between'>
      <div className='flex items-center gap-2 text-sm text-muted-foreground'>
        {icon}
        <span>{label}</span>
      </div>
      <span className='font-medium'>{value}</span>
    </div>
  )
}
