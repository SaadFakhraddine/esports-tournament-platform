'use client'

import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { useState } from 'react'
import { PublicLayout } from '@/components/layout/public-layout'
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
import { BracketView } from '@/components/bracket/bracket-view' // Import BracketView

export default function TournamentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const tournamentId = params.id as string
  const [activeTab, setActiveTab] = useState<'overview' | 'teams' | 'bracket'>('overview')

  const { data: tournament, isLoading, error } = trpc.tournament.getPublicOverviewById.useQuery(
    { id: tournamentId },
    { enabled: !!tournamentId }
  )

  const {
    data: bracketTree,
    isLoading: bracketTreeLoading,
  } = trpc.tournament.getPublicBracketTree.useQuery(
    { tournamentId },
    {
      enabled: !!tournamentId && activeTab === 'bracket' && (tournament?.bracketsCount ?? 0) > 0,
    }
  )

  if (isLoading) {
    return (
      <PublicLayout>
        <TournamentDetailSkeleton />
      </PublicLayout>
    )
  }

  if (error || !tournament) {
    return (
      <PublicLayout>
        <div className='flex items-center justify-center min-h-[60vh]'>
          <Alert variant='destructive' className='max-w-md'>
            <AlertCircle className='h-4 w-4' />
            <AlertDescription>
              {error?.message || 'Tournament not found'}
            </AlertDescription>
          </Alert>
        </div>
      </PublicLayout>
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
      // Redirect to login with return URL (URL-encoded for safety)
      const returnPath = `/tournaments/${tournamentId}`
      router.push(`/login?returnUrl=${encodeURIComponent(returnPath)}`)
    }
  }

  return (
    <PublicLayout>
      <div className='space-y-6'>
        {/* Header with Banner */}
        {tournament.banner && (
          <div className='relative h-64 rounded-lg overflow-hidden -mx-4 md:mx-0'>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={tournament.banner}
              alt={tournament.name}
              className='w-full h-full object-cover'
            />
            <div className='absolute inset-0 bg-gradient-to-t from-background to-transparent' />
          </div>
        )}

        {/* Tournament Header */}
        <div className='flex flex-col gap-4 md:flex-row md:items-start md:justify-between'>
          <div className='space-y-2'>
            <div className='flex items-center gap-3 flex-wrap'>
              <h1 className='text-3xl font-bold tracking-tight'>{tournament.name}</h1>
              <Badge
                variant='outline'
                className={statusColors[tournament.status]}
              >
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
                <span>{tournament.registrations?.length || 0}/{tournament.maxTeams} Teams</span>
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
                      <p className='text-muted-foreground whitespace-pre-wrap'>
                        {tournament.description}
                      </p>
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
                      <p className='text-muted-foreground whitespace-pre-wrap'>
                        {tournament.rules}
                      </p>
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
                      <p className='text-2xl font-bold text-primary'>
                        {tournament.prizePool}
                      </p>
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
                          <Link
                            key={registration.team.id}
                            href={`/teams/${registration.team.id}`}
                          >
                            <div className='flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors'>
                              <div className='flex items-center gap-3'>
                                <div className='flex items-center justify-center w-8 h-8 rounded-full bg-muted font-bold'>
                                  {registration.seed || index + 1}
                                </div>
                                <div>
                                  <p className='font-medium'>{registration.team.name}</p>
                                  {registration.team.tag && (
                                    <p className='text-sm text-muted-foreground'>
                                      [{registration.team.tag}]
                                    </p>
                                  )}
                                </div>
                              </div>
                              <Badge variant='secondary'>
                                {registration.status}
                              </Badge>
                            </div>
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <div className='text-center py-8 text-muted-foreground'>
                        <Users className='h-12 w-12 mx-auto mb-2 opacity-50' />
                        <p>No teams registered yet</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value='bracket' className='mt-6'>
                <Card>
                  <CardHeader>
                    <CardTitle>Tournament Bracket</CardTitle>
                    <CardDescription>
                      {bracketTreeLoading
                        ? 'Loading tournament bracket...'
                        : bracketTree?.brackets?.length
                          ? 'View the tournament bracket and matchups'
                          : 'Bracket will be available once tournament starts'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {/* Use BracketView component */}
                    {bracketTreeLoading ? (
                      <Skeleton className='h-96 w-full' />
                    ) : bracketTree?.brackets && bracketTree.brackets.length > 0 ? (
                      (() => {
                        // Flatten and map matches to the format expected by BracketView
                        const mappedMatches = bracketTree.brackets.flatMap(bracket =>
                          (bracket.matches || []).map((match: {
                            id: string;
                            matchNumber?: number;
                            scheduledAt?: Date | null;
                            status: string;
                            homeTeam?: {
                              id: string;
                              name: string;
                              logo?: string | null;
                            } | null;
                            awayTeam?: {
                              id: string;
                              name: string;
                              logo?: string | null;
                            } | null;
                            homeScore?: number | null;
                            awayScore?: number | null;
                            winnerId?: string | null;
                          }, matchIndex: number) => ({
                            id: match.id,
                            round: bracket.round, // Use the round from the bracket
                            // NOTE: 'matchNumber' is expected by BracketView's Match interface.
                            // Assuming it might be available on the 'match' object from the API.
                            // If not, this might cause a runtime error if BracketView strictly requires it.
                            matchNumber: match.matchNumber ?? matchIndex + 1,
                            scheduledAt: match.scheduledAt,
                            status: match.status,
                            team1: match.homeTeam ? {
                              id: match.homeTeam.id,
                              name: match.homeTeam.name,
                              logo: match.homeTeam.logo, // Assuming logo might be available
                            } : null,
                            team2: match.awayTeam ? {
                              id: match.awayTeam.id,
                              name: match.awayTeam.name,
                              logo: match.awayTeam.logo, // Assuming logo might be available
                            } : null,
                            team1Score: match.homeScore ?? 0,
                            team2Score: match.awayScore ?? 0,
                            winnerId: match.winnerId,
                          }))
                        );

                        // If no matches are found after flattening, display the "not generated" message.
                        if (mappedMatches.length === 0) {
                          return (
                            <div className='text-center py-8 text-muted-foreground'>
                              <Trophy className='h-12 w-12 mx-auto mb-2 opacity-50' />
                              <p>Bracket not generated yet</p>
                            </div>
                          );
                        }

                        return (
                          <BracketView
                            matches={mappedMatches}
                            tournamentFormat={tournament.format} // Assuming tournament.format matches the expected enum string
                            // onMatchClick={(matchId) => { console.log('Match clicked:', matchId); }} // Optional: handler for match clicks
                          />
                        );
                      })()
                    ) : (
                      // Fallback for when tournament.brackets is empty or null
                      <div className='text-center py-8 text-muted-foreground'>
                        <Trophy className='h-12 w-12 mx-auto mb-2 opacity-50' />
                        <p>Bracket not generated yet</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Column - Sidebar */}
          <div className='space-y-6'>
            {/* Schedule Card */}
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Calendar className='h-5 w-5' />
                  Schedule
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div>
                  <p className='text-sm text-muted-foreground mb-1'>Registration</p>
                  <div className='flex items-center gap-2 text-sm'>
                    <Clock className='h-4 w-4' />
                    <span>
                      {format(new Date(tournament.registrationStart), 'MMM d, yyyy')}
                      {' - '}
                      {format(new Date(tournament.registrationEnd), 'MMM d, yyyy')}
                    </span>
                  </div>
                </div>
                <div>
                  <p className='text-sm text-muted-foreground mb-1'>Tournament</p>
                  <div className='flex items-center gap-2 text-sm'>
                    <Calendar className='h-4 w-4' />
                    <span>
                      {format(new Date(tournament.startDate), 'MMM d, yyyy h:mm a')}
                      {tournament.endDate && (
                        <>
                          {' - '}
                          {format(new Date(tournament.endDate), 'MMM d, yyyy h:mm a')}
                        </>
                      )}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Organizer Card */}
            <Card>
              <CardHeader>
                <CardTitle>Organizer</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='flex items-center gap-3'>
                  <div className='h-10 w-10 rounded-full bg-gradient-purple flex items-center justify-center text-white font-semibold'>
                    {tournament.organizer.name?.charAt(0) || 'O'}
                  </div>
                  <div>
                    <p className='font-medium'>{tournament.organizer.name}</p>
                    <p className='text-sm text-muted-foreground'>
                      @{tournament.organizer.username || tournament.organizer.name}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Action Card */}
            <Card>
              <CardHeader>
                <CardTitle>
                  {session ? (canManage ? 'Register a Team' : 'Join Tournament') : 'Join Tournament'}
                </CardTitle>
                <CardDescription>
                  {tournament.status === 'REGISTRATION'
                    ? session
                      ? canManage
                        ? 'Register and approve teams for this tournament'
                        : 'Register your team to compete'
                      : 'Sign in to register your team'
                    : tournament.status === 'SEEDING'
                    ? 'Registration is closed. Tournament is being seeded.'
                    : tournament.status === 'IN_PROGRESS'
                    ? 'Tournament is in progress'
                    : 'Registration is not available'}
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-3'>
                {tournament.status === 'REGISTRATION' ? (
                  <>
                    {session ? (
                      <>
                        <RegisterTeamDialog
                          tournamentId={tournament.id}
                          tournamentName={tournament.name}
                          isAdmin={isAdmin}
                        />
                        {canManage && (
                          <Link href={`/dashboard/tournaments/${tournament.id}/registrations`}>
                            <Button variant='outline' className='w-full'>
                              Manage Registrations
                            </Button>
                          </Link>
                        )}
                      </>
                    ) : (
                      <Button
                        onClick={handleRegisterClick}
                        className='w-full gradient-purple gap-2'
                      >
                        <UserPlus className='h-4 w-4' />
                        Sign in to Register
                      </Button>
                    )}
                  </>
                ) : canManage ? (
                  <>
                    <Alert>
                      <Info className='h-4 w-4' />
                      <AlertDescription className='text-sm'>
                        Registration is closed. Go to tournament management to reopen.
                      </AlertDescription>
                    </Alert>
                    <Link href={`/dashboard/tournaments/${tournament.id}/edit`}>
                      <Button variant='outline' className='w-full'>
                        Manage Tournament
                      </Button>
                    </Link>
                  </>
                ) : (
                  <Alert>
                    <Info className='h-4 w-4' />
                    <AlertDescription className='text-sm'>
                      Registration is currently closed.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PublicLayout>
  )
}

function TournamentDetailSkeleton() {
  return (
    <div className='space-y-6'>
      <Skeleton className='h-64 w-full' />
      <div className='flex justify-between items-start'>
        <div className='space-y-2'>
          <Skeleton className='h-10 w-96' />
          <Skeleton className='h-6 w-64' />
        </div>
        <Skeleton className='h-10 w-32' />
      </div>
      <div className='grid gap-6 lg:grid-cols-3'>
        <div className='lg:col-span-2'>
          <Skeleton className='h-96 w-full' />
        </div>
        <div className='space-y-6'>
          <Skeleton className='h-48 w-full' />
          <Skeleton className='h-32 w-full' />
        </div>
      </div>
    </div>
  )
}
