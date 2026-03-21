'use client'

import type { ReactNode } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  TrendingUp,
  Trophy,
  Users,
  Calendar,
  Target,
  Medal,
  Gamepad2,
} from 'lucide-react'
import { trpc } from '@/lib/trpc/client'

export default function PlayerStatsPage() {
  const { data: session, status } = useSession({ required: true })
  const { data: stats, isLoading } = trpc.user.getPlayerStats.useQuery(undefined, {
    enabled: !!session,
    staleTime: 60_000,
  })

  if (status === 'loading' || !session) {
    return (
      <DashboardLayout>
        <div className='space-y-6'>
          <Skeleton className='h-10 w-64' />
          <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className='h-32' />
            ))}
          </div>
        </div>
      </DashboardLayout>
    )
  }

  const s = stats?.summary

  return (
    <DashboardLayout userRole={session.user.role}>
      <div className='space-y-8'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight flex items-center gap-2'>
            <Medal className='h-8 w-8 text-primary' />
            Player stats
          </h1>
          <p className='text-muted-foreground mt-1'>
            Match history and performance across teams you&apos;re on
          </p>
        </div>

        {isLoading || !s ? (
          <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className='h-28' />
            ))}
          </div>
        ) : (
          <>
            <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6'>
              <StatTile
                label='Win rate'
                value={`${s.winRate}%`}
                sub={`${s.wins}W · ${s.losses}L`}
                icon={<TrendingUp className='h-5 w-5' />}
              />
              <StatTile
                label='Matches played'
                value={String(s.completedMatches)}
                sub='Completed'
                icon={<Target className='h-5 w-5' />}
              />
              <StatTile
                label='Teams'
                value={String(s.teamsCount)}
                sub={"You're a member"}
                icon={<Users className='h-5 w-5' />}
              />
              <StatTile
                label='Active tournaments'
                value={String(s.activeTournamentsCount)}
                sub='Registered & live'
                icon={<Trophy className='h-5 w-5' />}
              />
              <StatTile
                label='Tournaments finished'
                value={String(s.tournamentsCompleted)}
                sub='You participated'
                icon={<Medal className='h-5 w-5' />}
              />
              <StatTile
                label='Upcoming matches'
                value={String(s.upcomingMatchesCount)}
                sub='Scheduled'
                icon={<Calendar className='h-5 w-5' />}
              />
            </div>

            {stats.byTeam.length === 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>No teams yet</CardTitle>
                  <CardDescription>
                    Join or create a team to start tracking match stats.
                  </CardDescription>
                </CardHeader>
                <CardContent className='flex flex-wrap gap-3'>
                  <Button asChild>
                    <Link href='/teams'>Browse teams</Link>
                  </Button>
                  <Button variant='outline' asChild>
                    <Link href='/teams/create'>Create a team</Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className='grid gap-6 lg:grid-cols-2'>
                <Card>
                  <CardHeader>
                    <CardTitle>By team</CardTitle>
                    <CardDescription>Wins and losses for each roster you play on</CardDescription>
                  </CardHeader>
                  <CardContent className='space-y-4'>
                    {stats.byTeam.map((row) => (
                      <div
                        key={row.teamId}
                        className='flex items-center justify-between gap-3 rounded-lg border p-3'
                      >
                        <div className='flex items-center gap-3 min-w-0'>
                          <Avatar className='h-10 w-10 shrink-0'>
                            <AvatarImage src={row.logo ?? undefined} />
                            <AvatarFallback>{row.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div className='min-w-0'>
                            <Link
                              href={`/teams/${row.teamId}`}
                              className='font-medium hover:underline truncate block'
                            >
                              {row.name}
                            </Link>
                            <p className='text-xs text-muted-foreground'>
                              {row.played} played · {row.wins}W {row.losses}L
                            </p>
                          </div>
                        </div>
                        <Badge variant='secondary' className='shrink-0'>
                          {row.winRate}%
                        </Badge>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className='flex items-center gap-2'>
                      <Gamepad2 className='h-5 w-5 text-muted-foreground' />
                      By game
                    </CardTitle>
                    <CardDescription>
                      Win rate and record per title (from completed tournament matches)
                    </CardDescription>
                  </CardHeader>
                  <CardContent className='space-y-4'>
                    {stats.byGame.length === 0 ? (
                      <p className='text-sm text-muted-foreground text-center py-6'>
                        No completed matches yet — stats will appear per game after you play.
                      </p>
                    ) : (
                      stats.byGame.map((row) => (
                        <div
                          key={row.gameId}
                          className='flex items-center justify-between gap-3 rounded-lg border p-3'
                        >
                          <div className='flex items-center gap-3 min-w-0'>
                            <Avatar className='h-10 w-10 shrink-0 rounded-md'>
                              <AvatarImage src={row.icon ?? undefined} />
                              <AvatarFallback className='rounded-md text-xs'>
                                {row.name.slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className='min-w-0'>
                              <p className='font-medium truncate'>{row.name}</p>
                              <p className='text-xs text-muted-foreground'>
                                {row.played} played · {row.wins}W {row.losses}L
                              </p>
                            </div>
                          </div>
                          <Badge variant='secondary' className='shrink-0'>
                            {row.winRate}%
                          </Badge>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>

                <Card className='lg:col-span-2'>
                  <CardHeader>
                    <CardTitle>Recent matches</CardTitle>
                    <CardDescription>Latest completed games involving your teams</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {stats.recentMatches.length === 0 ? (
                      <p className='text-sm text-muted-foreground text-center py-8'>
                        No completed matches yet. Enter a tournament and play some games!
                      </p>
                    ) : (
                      <ul className='space-y-3'>
                        {stats.recentMatches.map((m) => (
                          <li
                            key={m.id}
                            className='rounded-lg border p-3 text-sm space-y-2'
                          >
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
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  )
}

function StatTile({
  label,
  value,
  sub,
  icon,
}: {
  label: string
  value: string
  sub: string
  icon: ReactNode
}) {
  return (
    <Card>
      <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
        <CardTitle className='text-sm font-medium'>{label}</CardTitle>
        <div className='text-muted-foreground'>{icon}</div>
      </CardHeader>
      <CardContent>
        <div className='text-2xl font-bold'>{value}</div>
        <p className='text-xs text-muted-foreground mt-1'>{sub}</p>
      </CardContent>
    </Card>
  )
}
