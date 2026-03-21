'use client'

import { useMemo } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Plus, Trophy, Users, Calendar, TrendingUp, Bell, Activity, BarChart3 } from 'lucide-react'
import { trpc } from '@/lib/trpc/client'

export default function DashboardPage() {
  const { data: session, status } = useSession({
    required: true,
  })
  const { data: stats, isLoading: statsLoading } = trpc.user.getDashboardStats.useQuery(undefined, {
    enabled: !!session,
  })
  const { data: tournaments, isLoading: tournamentsLoading } = trpc.tournament.getParticipatingTournaments.useQuery(
    { limit: 3 },
    { enabled: !!session }
  )
  const { data: teams, isLoading: teamsLoading } = trpc.team.getMyTeams.useQuery(undefined, {
    enabled: !!session,
  })
  const { data: personalActivity, isLoading: personalActivityLoading } = trpc.user.getRecentActivity.useQuery(
    { limit: 8 },
    { enabled: !!session }
  )
  const { data: platformActivity, isLoading: platformActivityLoading } = trpc.stats.getRecentActivity.useQuery(
    { limit: 12 },
    { enabled: !!session, staleTime: 60_000 }
  )

  const recentActivity = useMemo(() => {
    const toDate = (d: Date | string) => (d instanceof Date ? d : new Date(d))

    const personal = (personalActivity ?? []).map((a) => ({
      ...a,
      timestamp: toDate(a.timestamp),
    }))

    const platform = (platformActivity ?? []).map((a) => ({
      id: `platform-${a.id}`,
      type: a.type,
      title:
        a.type === 'registration'
          ? 'Team registered'
          : a.type === 'completion'
            ? 'Tournament completed'
            : 'Registration opened',
      description: a.message,
      link: a.link,
      timestamp: toDate(a.timestamp),
    }))

    return [...personal, ...platform]
      .sort((x, y) => y.timestamp.getTime() - x.timestamp.getTime())
      .slice(0, 8)
  }, [personalActivity, platformActivity])

  const activityLoading = personalActivityLoading || platformActivityLoading

  if (status === 'loading' || !session) {
    return <DashboardSkeleton />
  }

  const isOrganizer = session.user.role === 'ORGANIZER' || session.user.role === 'ADMIN'

  return (
    <DashboardLayout userRole={session.user.role}>
      <div className='space-y-8'>
        {/* Header */}
        <div className='flex items-center justify-between'>
          <div>
            <h1 className='text-3xl font-bold tracking-tight'>
              Welcome back, {session.user.name || session.user.username}!
            </h1>
            <p className='text-muted-foreground mt-2'>
              Here&apos;s what&apos;s happening with your tournaments and teams
            </p>
          </div>
          {isOrganizer && (
            <Link href='/dashboard/tournaments/create'>
              <Button className='gap-2'>
                <Plus className='h-4 w-4' />
                Create Tournament
              </Button>
            </Link>
          )}
        </div>

        {/* Stats Grid */}
        <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
          {statsLoading ? (
            <>
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className='h-32' />
              ))}
            </>
          ) : (
            <>
              <StatCard
                title='Active Tournaments'
                value={stats?.activeTournamentsCount?.toString() || '0'}
                description='Tournaments in progress'
                icon={<Trophy className='h-4 w-4 text-muted-foreground' />}
              />
              <StatCard
                title='Teams'
                value={stats?.teamsCount?.toString() || '0'}
                description={`Member of ${stats?.teamsCount || 0} team${stats?.teamsCount !== 1 ? 's' : ''}`}
                icon={<Users className='h-4 w-4 text-muted-foreground' />}
              />
              <StatCard
                title='Upcoming Matches'
                value={stats?.upcomingMatchesCount?.toString() || '0'}
                description='Scheduled matches'
                icon={<Calendar className='h-4 w-4 text-muted-foreground' />}
              />
              <StatCard
                title='Win Rate'
                value={`${stats?.winRate || 0}%`}
                description={`${stats?.wonMatches || 0} of ${stats?.totalMatches || 0} matches won`}
                icon={<TrendingUp className='h-4 w-4 text-muted-foreground' />}
              />
            </>
          )}
        </div>

        <div className='flex justify-end -mt-2'>
          <Button variant='outline' size='sm' asChild>
            <Link href='/dashboard/stats'>
              <BarChart3 className='h-4 w-4 mr-2' />
              Full player stats
            </Link>
          </Button>
        </div>

        {/* Main Content Grid */}
        <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-7'>
          {/* Recent Tournaments */}
          <Card className='col-span-4'>
            <CardHeader>
              <CardTitle>Recent Tournaments</CardTitle>
              <CardDescription>
                Tournaments you&apos;re participating in or organizing
              </CardDescription>
            </CardHeader>
            <CardContent>
              {tournamentsLoading ? (
                <div className='space-y-4'>
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className='h-16' />
                  ))}
                </div>
              ) : tournaments && tournaments.length > 0 ? (
                <div className='space-y-4'>
                  {tournaments.slice(0, 3).map((tournament) => (
                    <TournamentItem
                      key={tournament.id}
                      id={tournament.id}
                      name={tournament.name}
                      game={tournament.game?.name ?? 'Unknown game'}
                      status={tournament.status}
                      participants={`${tournament._count?.registrations || 0}/${tournament.maxTeams}`}
                    />
                  ))}
                </div>
              ) : (
                <div className='text-center py-8'>
                  <p className='text-sm text-muted-foreground'>
                    No tournaments yet. Browse tournaments to join!
                  </p>
                </div>
              )}
              <Link href='/tournaments'>
                <Button variant='ghost' className='w-full mt-4'>
                  View All Tournaments
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className='col-span-3'>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Activity className='h-5 w-5' />
                Recent Activity
              </CardTitle>
              <CardDescription>
                Your updates mixed with platform-wide registrations, results, and new tournaments
              </CardDescription>
            </CardHeader>
            <CardContent>
              {activityLoading ? (
                <div className='space-y-3'>
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className='h-16' />
                  ))}
                </div>
              ) : recentActivity && recentActivity.length > 0 ? (
                <div className='space-y-3 max-h-96 overflow-y-auto'>
                  {recentActivity.map((activity) => (
                    <ActivityItem key={activity.id} activity={activity} />
                  ))}
                </div>
              ) : (
                <div className='text-center py-8'>
                  <Activity className='h-10 w-10 text-muted-foreground mx-auto mb-2' />
                  <p className='text-sm text-muted-foreground'>
                    No recent activity yet. Start by joining a team or tournament!
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* My Teams */}
        <Card>
          <CardHeader>
            <CardTitle>My Teams</CardTitle>
            <CardDescription>
              Teams you&apos;re a member of
            </CardDescription>
          </CardHeader>
          <CardContent>
            {teamsLoading ? (
              <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className='h-32' />
                ))}
              </div>
            ) : (
              <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
                {teams && teams.length > 0 ? (
                  <>
                    {teams.slice(0, 2).map((team) => (
                      <TeamCard
                        key={team.id}
                        id={team.id}
                        name={team.name}
                        game={team.game?.name ?? 'Unknown game'}
                        role={team.userRole}
                        members={team._count?.members || 0}
                      />
                    ))}
                  </>
                ) : null}
                <div className='border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-center hover:border-primary transition-colors cursor-pointer'>
                  <Link href='/teams/create' className='w-full'>
                    <Plus className='h-8 w-8 text-muted-foreground mx-auto mb-2' />
                    <p className='text-sm font-medium'>Create New Team</p>
                    <p className='text-xs text-muted-foreground mt-1'>
                      Start building your roster
                    </p>
                  </Link>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}

// Component for stat cards
function StatCard({
  title,
  value,
  description,
  icon,
}: {
  title: string
  value: string
  description: string
  icon: React.ReactNode
}) {
  return (
    <Card>
      <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
        <CardTitle className='text-sm font-medium'>{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className='text-2xl font-bold'>{value}</div>
        <p className='text-xs text-muted-foreground mt-1'>{description}</p>
      </CardContent>
    </Card>
  )
}

// Component for tournament items
function TournamentItem({
  id,
  name,
  game,
  status,
  participants,
}: {
  id: string
  name: string
  game: string
  status: string
  participants: string
}) {
  const statusColors = {
    IN_PROGRESS: 'bg-green-500/10 text-green-500 border-green-500/20',
    REGISTRATION: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    SEEDING: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    COMPLETED: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
    DRAFT: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
    CANCELLED: 'bg-red-500/10 text-red-500 border-red-500/20',
  }

  return (
    <Link href={`/tournaments/${id}`}>
      <div className='flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer'>
        <div className='flex-1'>
          <p className='font-medium'>{name}</p>
          <p className='text-sm text-muted-foreground'>{game}</p>
        </div>
        <div className='flex items-center gap-3'>
          <span className='text-sm text-muted-foreground'>{participants}</span>
          <Badge
            variant='outline'
            className={statusColors[status as keyof typeof statusColors] || statusColors.DRAFT}
          >
            {status.replace(/_/g, ' ')}
          </Badge>
        </div>
      </div>
    </Link>
  )
}

// Component for team cards
function TeamCard({
  id,
  name,
  game,
  role,
  members,
}: {
  id: string
  name: string
  game: string
  role: string
  members: number
}) {
  return (
    <Link href={`/teams/${id}`}>
      <Card className='hover:shadow-lg transition-shadow cursor-pointer'>
        <CardHeader>
          <div className='flex items-start justify-between'>
            <div>
              <CardTitle className='text-lg'>{name}</CardTitle>
              <CardDescription>{game}</CardDescription>
            </div>
            <Badge variant='secondary'>{role}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className='flex items-center text-sm text-muted-foreground'>
            <Users className='h-4 w-4 mr-1' />
            {members} members
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

// Component for activity items
type ActivityItemType = {
  id: string
  type: 'notification' | 'match' | 'registration' | 'invitation' | string
  title: string
  description: string
  timestamp: Date
  link?: string | null
  read?: boolean
  metadata?: {
    tournamentName?: string
  }
}

function ActivityItem({ activity }: { activity: ActivityItemType }) {
  const getIcon = () => {
    switch (activity.type) {
      case 'notification':
        return <Bell className='h-4 w-4' />
      case 'match':
        return <Trophy className='h-4 w-4 text-green-500' />
      case 'registration':
        return <Calendar className='h-4 w-4 text-blue-500' />
      case 'invitation':
        return <Users className='h-4 w-4 text-purple-500' />
      case 'completion':
        return <Trophy className='h-4 w-4 text-amber-500' />
      case 'new_tournament':
        return <Calendar className='h-4 w-4 text-cyan-500' />
      default:
        return <Activity className='h-4 w-4' />
    }
  }

  const getTimeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000)
    if (seconds < 60) return 'just now'
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    if (days < 7) return `${days}d ago`
    return new Date(date).toLocaleDateString()
  }

  const content = (
    <div className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${activity.link ? 'hover:bg-muted/50 cursor-pointer' : ''
      } ${activity.read === false ? 'bg-primary/5 border-primary/20' : ''}`}>
      <div className='mt-0.5'>{getIcon()}</div>
      <div className='flex-1 min-w-0'>
        <p className='text-sm font-medium leading-tight'>{activity.title}</p>
        <p className='text-xs text-muted-foreground mt-0.5 line-clamp-2'>
          {activity.description}
        </p>
        {activity.metadata?.tournamentName && (
          <p className='text-xs text-muted-foreground mt-1'>
            in {activity.metadata.tournamentName}
          </p>
        )}
      </div>
      <span className='text-xs text-muted-foreground whitespace-nowrap'>
        {getTimeAgo(activity.timestamp)}
      </span>
    </div>
  )

  if (activity.link) {
    return <Link href={activity.link}>{content}</Link>
  }

  return content
}

// Loading skeleton
function DashboardSkeleton() {
  return (
    <DashboardLayout>
      <div className='space-y-8'>
        <div>
          <Skeleton className='h-10 w-64' />
          <Skeleton className='h-4 w-96 mt-2' />
        </div>
        <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className='h-32' />
          ))}
        </div>
        <div className='grid gap-4 md:grid-cols-2'>
          <Skeleton className='h-96' />
          <Skeleton className='h-96' />
        </div>
      </div>
    </DashboardLayout>
  )
}
