'use client'

import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Calendar,
  Users,
  Trophy,
  Settings,
  Edit,
  AlertCircle,
  Clock,
  MapPin,
  Award,
  FileText,
  Info,
  UserPlus,
} from 'lucide-react'
import { trpc } from '@/lib/trpc/client'
import { format } from 'date-fns'
import { RegisterTeamDialog } from '@/components/tournament/register-team-dialog'
import { BracketView } from '@/components/bracket/bracket-view'

export default function TournamentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const tournamentId = params.id as string
  const [activeTab, setActiveTab] = useState<'overview' | 'teams' | 'bracket'>('overview')

  const { data: tournament, isLoading, error } = trpc.tournament.getPublicOverviewById.useQuery(
    { id: tournamentId },
    { enabled: !!tournamentId },
  )

  const { data: bracketTree, isLoading: bracketTreeLoading } = trpc.tournament.getPublicBracketTree.useQuery(
    { tournamentId },
    {
      enabled: !!tournamentId && activeTab === 'bracket' && (tournament?.bracketsCount ?? 0) > 0,
    },
  )

  if (isLoading) {
    return <TournamentDetailSkeleton />
  }

  if (error || !tournament) {
    return (
      <div className='flex items-center justify-center min-h-[60vh]'>
        <Alert variant='destructive' className='max-w-md'>
          <AlertCircle className='h-4 w-4' />
          <AlertDescription>{error?.message || 'Tournament not found'}</AlertDescription>
        </Alert>
      </div>
    )
  }

  const isOrganizer = session?.user?.id === tournament.organizer.id
  const isAdmin = session?.user?.role === 'ADMIN'
  const canManage = isOrganizer || isAdmin

  const statusColors: Record<string, string> = {
    DRAFT: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
    REGISTRATION: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    SEEDING: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    IN_PROGRESS: 'bg-green-500/10 text-green-500 border-green-500/20',
    COMPLETED: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
    CANCELLED: 'bg-red-500/10 text-red-500 border-red-500/20',
  }

  const formatLabels: Record<string, string> = {
    SINGLE_ELIMINATION: 'Single Elimination',
    DOUBLE_ELIMINATION: 'Double Elimination',
    ROUND_ROBIN: 'Round Robin',
    SWISS: 'Swiss',
  }

  const handleRegisterClick = () => {
    if (!session) {
      const returnPath = `/tournaments/${tournamentId}`
      router.push(`/login?returnUrl=${encodeURIComponent(returnPath)}`)
    }
  }

  return (
    <div className='space-y-6'>
      {/* Header with Banner */}
      {tournament.banner && (
        <div className='relative h-64 rounded-lg overflow-hidden -mx-4 md:mx-0'>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={tournament.banner} alt={tournament.name} className='w-full h-full object-cover' />
          <div className='absolute inset-0 bg-gradient-to-t from-background to-transparent' />
        </div>
      )}

      {/* Tournament Header */}
      <div className='flex flex-col gap-4 md:flex-row md:items-start md:justify-between'>
        <div className='space-y-2'>
          <div className='flex items-center gap-3 flex-wrap'>
            <h1 className='text-3xl font-bold tracking-tight'>{tournament.name}</h1>
            <Badge variant='outline' className={statusColors[tournament.status]}>
              {tournament.status.replace(/_/g, ' ')}
            </Badge>
          </div>
          <div className='flex items-center gap-4 text-muted-foreground flex-wrap'>
            <div className='flex items-center gap-1'>
              <MapPin className='h-4 w-4' />
              <span>
                {tournament.game.icon && <span className='mr-1'>{tournament.game.icon}</span>}
                {tournament.game.name}
              </span>
            </div>
            <div className='flex items-center gap-1'>
              <Trophy className='h-4 w-4' />
              <span>{formatLabels[tournament.format]}</span>
            </div>
            <div className='flex items-center gap-1'>
              <Users className='h-4 w-4' />
              <span>
                {tournament.registrations?.length || 0}/{tournament.maxTeams} Teams
              </span>
            </div>
          </div>
        </div>

        {canManage && (
          <div className='flex gap-2'>
            <Link href={`/dashboard/tournaments/${tournament.id}/edit`}>
              <Button variant='outline' className='gap-2'>
                <Edit className='h-4 w-4' />
                Edit
              </Button>
            </Link>
            <Link href={`/dashboard/tournaments/${tournament.id}`}>
              <Button className='gap-2 gradient-purple'>
                <Settings className='h-4 w-4' />
                Manage
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className='grid gap-6 lg:grid-cols-3'>
        {/* Left Column - Main Info */}
        <div className='lg:col-span-2 space-y-6'>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
            <TabsList className='grid w-full grid-cols-3'>
              <TabsTrigger value='overview'>Overview</TabsTrigger>
              <TabsTrigger value='teams'>Teams</TabsTrigger>
              <TabsTrigger value='bracket'>Bracket</TabsTrigger>
            </TabsList>

            <TabsContent value='overview' className='space-y-4 mt-6'>
              {/* Description */}
              {tournament.description && (
                <Card>
                  <CardHeader>
                    <CardTitle>About</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className='text-muted-foreground whitespace-pre-wrap'>{tournament.description}</p>
                  </CardContent>
                </Card>
              )}

              {/* Rules */}
              {tournament.rules && (
                <Card>
                  <CardHeader>
                    <CardTitle className='flex items-center gap-2'>
                      <FileText className='h-5 w-5' />
                      Rules
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className='text-muted-foreground whitespace-pre-wrap'>{tournament.rules}</p>
                  </CardContent>
                </Card>
              )}

              {/* Prize Pool */}
              {tournament.prizePool && (
                <Card>
                  <CardHeader>
                    <CardTitle className='flex items-center gap-2'>
                      <Award className='h-5 w-5' />
                      Prize Pool
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className='text-2xl font-bold text-primary'>{tournament.prizePool}</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value='teams' className='mt-6'>
              <Card>
                <CardHeader>
                  <CardTitle>Registered Teams</CardTitle>
                  <CardDescription>
                    {tournament.registrations?.length || 0} of {tournament.maxTeams} teams registered
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {tournament.registrations && tournament.registrations.length > 0 ? (
                    <div className='space-y-3'>
                      {tournament.registrations.map((registration, index) => (
                        <Link key={registration.team.id} href={`/teams/${registration.team.id}`}>
                          <div className='flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors'>
                            <div className='flex items-center gap-3'>
                              <div className='flex items-center justify-center w-8 h-8 rounded-full bg-muted font-bold'>
                                {registration.seed || index + 1}
                              </div>
                              <div>
                                <p className='font-medium'>{registration.team.name}</p>
                                {registration.team.tag && (
                                  <p className='text-sm text-muted-foreground'>[{registration.team.tag}]</p>
                                )}
                              </div>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <p className='text-sm text-muted-foreground'>No teams registered yet</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value='bracket' className='mt-6'>
              {(tournament.bracketsCount ?? 0) === 0 ? (
                <Card>
                  <CardContent className='py-10 text-center'>
                    <Info className='h-10 w-10 mx-auto mb-3 text-muted-foreground' />
                    <p className='text-muted-foreground'>Bracket not available yet.</p>
                  </CardContent>
                </Card>
              ) : bracketTreeLoading ? (
                <Skeleton className='h-72 w-full' />
              ) : (
                <BracketView
                  format={tournament.format}
                  matches={[]}
                  bracketTree={bracketTree?.brackets ?? []}
                  isLoading={bracketTreeLoading}
                />
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Column - Sidebar */}
        <div className='space-y-6'>
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Calendar className='h-5 w-5' />
                Tournament Info
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-4 text-sm'>
              <div className='flex items-center justify-between'>
                <span className='text-muted-foreground flex items-center gap-2'>
                  <Clock className='h-4 w-4' />
                  Start Date
                </span>
                <span className='font-medium'>{format(new Date(tournament.startDate), 'PPP')}</span>
              </div>
              <div className='flex items-center justify-between'>
                <span className='text-muted-foreground flex items-center gap-2'>
                  <Users className='h-4 w-4' />
                  Max Teams
                </span>
                <span className='font-medium'>{tournament.maxTeams}</span>
              </div>
            </CardContent>
          </Card>

          {/* Registration CTA */}
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <UserPlus className='h-5 w-5' />
                Registration
              </CardTitle>
              <CardDescription>
                {tournament.status === 'REGISTRATION'
                  ? 'Register your team to compete'
                  : 'Registration is currently closed'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {tournament.status === 'REGISTRATION' ? (
                session ? (
                  <RegisterTeamDialog tournamentId={tournament.id} maxTeams={tournament.maxTeams} />
                ) : (
                  <Button className='w-full gradient-purple' onClick={handleRegisterClick}>
                    Sign in to register
                  </Button>
                )
              ) : (
                <Button className='w-full' disabled>
                  Registration closed
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function TournamentDetailSkeleton() {
  return (
    <div className='space-y-6'>
      <Skeleton className='h-64 w-full rounded-lg' />
      <Skeleton className='h-10 w-2/3' />
      <Skeleton className='h-6 w-1/2' />
      <div className='grid gap-6 lg:grid-cols-3'>
        <div className='lg:col-span-2 space-y-4'>
          <Skeleton className='h-10 w-full' />
          <Skeleton className='h-72 w-full' />
        </div>
        <div className='space-y-4'>
          <Skeleton className='h-48 w-full' />
          <Skeleton className='h-40 w-full' />
        </div>
      </div>
    </div>
  )
}

