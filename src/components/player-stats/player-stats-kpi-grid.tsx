import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { PlayerStatsOutput } from './types'

type Props = {
  summary: PlayerStatsOutput['summary']
  currentStreak: PlayerStatsOutput['currentStreak']
}

export function PlayerStatsKpiGrid({ summary, currentStreak }: Props) {
  const streakLabel = currentStreak
    ? `${currentStreak.count}${currentStreak.type === 'win' ? 'W' : 'L'} streak`
    : 'No streak yet'

  return (
    <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6'>
      <StatTile
        label='Win rate'
        value={`${summary.winRate}%`}
        sub={`${summary.wins}W · ${summary.losses}L`}
        highlight
      />
      <StatTile
        label='Matches played'
        value={String(summary.completedMatches)}
        sub='Completed'
      />
      <StatTile label='Current streak' value={streakLabel} sub='Most recent results' />
      <StatTile label='Teams' value={String(summary.teamsCount)} sub="You're a member" />
      <StatTile
        label='Active tournaments'
        value={String(summary.activeTournamentsCount)}
        sub='Registered & live'
      />
      <StatTile
        label='Upcoming matches'
        value={String(summary.upcomingMatchesCount)}
        sub='Scheduled'
      />
    </div>
  )
}

function StatTile({
  label,
  value,
  sub,
  highlight,
}: {
  label: string
  value: string
  sub: string
  highlight?: boolean
}) {
  return (
    <Card className={highlight ? 'border-primary/40 bg-primary/5' : undefined}>
      <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
        <CardTitle className='text-sm font-medium'>{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${highlight ? 'text-primary' : ''}`}>{value}</div>
        <p className='text-xs text-muted-foreground mt-1'>{sub}</p>
      </CardContent>
    </Card>
  )
}

export function PlayerStatsHighlights({ summary }: { summary: PlayerStatsOutput['summary'] }) {
  if (!summary.bestGame && !summary.bestTeam) return null

  return (
    <div className='flex flex-wrap gap-2 text-sm text-muted-foreground'>
      {summary.bestTeam && (
        <span>
          Best team:{' '}
          <span className='text-foreground font-medium'>{summary.bestTeam.name}</span> (
          {summary.bestTeam.winRate}% over {summary.bestTeam.played} matches)
        </span>
      )}
      {summary.bestGame && (
        <span>
          Best game:{' '}
          <span className='text-foreground font-medium'>{summary.bestGame.name}</span> (
          {summary.bestGame.winRate}% over {summary.bestGame.played} matches)
        </span>
      )}
    </div>
  )
}
