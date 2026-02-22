'use client'

import { useSession } from 'next-auth/react'
import { redirect, useParams } from 'next/navigation'
import Link from 'next/link'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Users,
  Trophy,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  Play,
  AlertTriangle,
  Filter,
  MoreVertical,
} from 'lucide-react'
import { trpc } from '@/lib/trpc/client'
import { TournamentForm } from '@/components/tournament/tournament-form'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export default function TournamentManagePage() {
  const { data: session, status } = useSession()
  const params = useParams()
  const tournamentId = params.id as string

  const { data: tournament, isLoading: tournamentLoading } = trpc.tournament.getById.useQuery(
    { id: tournamentId },
    { enabled: !!session && !!tournamentId }
  )

  const { data: registrations, isLoading: registrationsLoading } =
    trpc.tournament.getRegistrations.useQuery(
      { tournamentId },
      { enabled: !!session && !!tournamentId }
    )

  const approveRegistrationMutation = trpc.tournament.approveRegistration.useMutation()
  const rejectRegistrationMutation = trpc.tournament.rejectRegistration.useMutation()
  const generateBracketMutation = trpc.tournament.generateBracket.useMutation()
  const regenerateBracketMutation = trpc.tournament.regenerateBracket.useMutation()
  const autoSeedMutation = trpc.tournament.autoSeedTeams.useMutation()
  const startTournamentMutation = trpc.tournament.startTournament.useMutation()

  const utils = trpc.useUtils()

  if (status === 'loading' || tournamentLoading) {
    return (
      <DashboardLayout userRole={session?.user?.role}>
        <div className="space-y-6">
          <Skeleton className="h-12 w-96" />
          <Skeleton className="h-64" />
        </div>
      </DashboardLayout>
    )
  }

  if (!session) {
    redirect('/login')
  }

  if (session.user.role !== 'ORGANIZER' && session.user.role !== 'ADMIN') {
    redirect('/tournaments')
  }

  if (!tournament) {
    return (
      <DashboardLayout userRole={session.user.role}>
        <div className="text-center py-12">
          <p className="text-lg font-medium">Tournament not found</p>
        </div>
      </DashboardLayout>
    )
  }

  const pendingCount = registrations?.filter((r) => r.status === 'PENDING').length || 0
  const approvedCount = registrations?.filter((r) => r.status === 'APPROVED').length || 0
  const hasBracket = tournament.brackets && tournament.brackets.length > 0
  const totalMatches =
    tournament.brackets?.reduce((sum, bracket) => sum + (bracket.matches?.length || 0), 0) || 0
  const canStart =
    approvedCount >= 2 &&
    hasBracket &&
    totalMatches > 0 &&
    tournament.status !== 'IN_PROGRESS' &&
    tournament.status !== 'COMPLETED' &&
    tournament.status !== 'CANCELLED'

  return (
    <DashboardLayout userRole={session.user.role}>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <h1 className="text-3xl font-bold tracking-tight">{tournament.name}</h1>
            <Badge
              variant="outline"
              className={
                tournament.status === 'DRAFT'
                  ? 'bg-gray-500/10 text-gray-500 border-gray-500/20'
                  : tournament.status === 'REGISTRATION'
                    ? 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                    : tournament.status === 'SEEDING'
                      ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                      : tournament.status === 'IN_PROGRESS'
                        ? 'bg-green-500/10 text-green-500 border-green-500/20'
                        : tournament.status === 'COMPLETED'
                          ? 'bg-purple-500/10 text-purple-500 border-purple-500/20'
                          : 'bg-red-500/10 text-red-500 border-red-500/20'
              }
            >
              {tournament.status.replace(/_/g, ' ')}
            </Badge>
          </div>
          <p className="text-muted-foreground">
            Manage tournament settings, registrations, and brackets
          </p>
        </div>

        {/* Management Tabs */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="registrations">Registrations</TabsTrigger>
            <TabsTrigger value="bracket">Bracket</TabsTrigger>
            <TabsTrigger value="matches">Matches</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <StatCard
                title="Total Teams"
                value={`${approvedCount}/${tournament.maxTeams}`}
                icon={<Users className="h-4 w-4 text-muted-foreground" />}
              />
              <StatCard
                title="Pending Approvals"
                value={pendingCount.toString()}
                icon={<Clock className="h-4 w-4 text-muted-foreground" />}
              />
              <StatCard
                title="Matches"
                value={tournament.brackets?.[0]?.matches?.length?.toString() || '0'}
                icon={<Trophy className="h-4 w-4 text-muted-foreground" />}
              />
              <StatCard
                title="Days Until Start"
                value={Math.max(
                  0,
                  Math.ceil(
                    (new Date(tournament.startDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                  )
                ).toString()}
                icon={<Calendar className="h-4 w-4 text-muted-foreground" />}
              />
            </div>

            {/* Start Tournament Alert */}
            {canStart && tournament.status !== 'IN_PROGRESS' && (
              <Card className="border-green-500/50 bg-green-500/5">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2 text-green-600">
                        <CheckCircle2 className="h-5 w-5" />
                        Ready to Start Tournament
                      </CardTitle>
                      <CardDescription>
                        All requirements met. You can start the tournament now.
                      </CardDescription>
                    </div>
                    <Button
                      size="lg"
                      className="gradient-purple gap-2"
                      onClick={async () => {
                        // Warn if registration is still open
                        if (tournament.status === 'REGISTRATION') {
                          if (
                            !confirm(
                              'Warning: Registration is still open. Starting the tournament will prevent new team registrations.\n\nDo you want to proceed?'
                            )
                          ) {
                            return
                          }
                        }

                        try {
                          await startTournamentMutation.mutateAsync({ tournamentId })
                          utils.tournament.getById.invalidate({ id: tournamentId })
                        } catch (error: unknown) {
                          alert(
                            `Cannot start tournament: ${error instanceof Error ? error.message : 'Unknown error'}`
                          )
                        }
                      }}
                      disabled={startTournamentMutation.isPending}
                    >
                      <Play className="h-5 w-5" />
                      {startTournamentMutation.isPending ? 'Starting...' : 'Start Tournament'}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-6 text-sm">
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>{approvedCount} teams approved</span>
                    </div>
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Bracket generated ({totalMatches} matches)</span>
                    </div>
                    {tournament.status === 'REGISTRATION' && (
                      <div className="flex items-center gap-2 text-yellow-600">
                        <AlertTriangle className="h-4 w-4" />
                        <span>Registration still open</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Cannot Start Alert */}
            {!canStart &&
              tournament.status !== 'IN_PROGRESS' &&
              tournament.status !== 'COMPLETED' &&
              tournament.status !== 'CANCELLED' && (
                <Card className="border-yellow-500/50 bg-yellow-500/5">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-yellow-600">
                      <AlertTriangle className="h-5 w-5" />
                      Tournament Not Ready
                    </CardTitle>
                    <CardDescription>
                      Complete the following steps before starting the tournament:
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      {approvedCount < 2 && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <XCircle className="h-4 w-4 text-red-500" />
                          <span>Need at least 2 approved teams (currently {approvedCount})</span>
                        </div>
                      )}
                      {(!hasBracket || totalMatches === 0) && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <XCircle className="h-4 w-4 text-red-500" />
                          <span>Generate tournament bracket below</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

            {/* Tournament In Progress */}
            {tournament.status === 'IN_PROGRESS' && (
              <Card className="border-blue-500/50 bg-blue-500/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-blue-600">
                    <Play className="h-5 w-5" />
                    Tournament In Progress
                  </CardTitle>
                  <CardDescription>
                    Matches are currently being played. Manage match results in the Matches tab.
                  </CardDescription>
                </CardHeader>
              </Card>
            )}

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common tournament management tasks</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-2">
                <Link href={`/dashboard/tournaments/${tournamentId}/registrations`}>
                  <Button variant="outline" className="justify-start w-full">
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Approve Pending Registrations
                    {pendingCount > 0 && (
                      <Badge className="ml-auto" variant="destructive">
                        {pendingCount}
                      </Badge>
                    )}
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  className="justify-start w-full"
                  onClick={async () => {
                    try {
                      await generateBracketMutation.mutateAsync({ tournamentId })
                      utils.tournament.getById.invalidate({ id: tournamentId })
                    } catch (error: unknown) {
                      alert(error instanceof Error ? error.message : 'An error occurred')
                    }
                  }}
                  disabled={generateBracketMutation.isPending || approvedCount < 2}
                >
                  <Trophy className="h-4 w-4 mr-2" />
                  {generateBracketMutation.isPending ? 'Generating...' : 'Generate Bracket'}
                </Button>
                <Button
                  variant="outline"
                  className="justify-start w-full"
                  onClick={async () => {
                    try {
                      await autoSeedMutation.mutateAsync({ tournamentId })
                      utils.tournament.getById.invalidate({ id: tournamentId })
                      utils.tournament.getRegistrations.invalidate({ tournamentId })
                    } catch (error: unknown) {
                      alert(error instanceof Error ? error.message : 'An error occurred')
                    }
                  }}
                  disabled={autoSeedMutation.isPending || approvedCount < 2}
                >
                  <Users className="h-4 w-4 mr-2" />
                  {autoSeedMutation.isPending ? 'Seeding...' : 'Seed Teams'}
                </Button>
                <Button
                  variant="outline"
                  className="justify-start w-full"
                  onClick={async () => {
                    if (tournament.status === 'REGISTRATION') {
                      if (
                        !confirm(
                          'Warning: Registration is still open. Starting the tournament will prevent new team registrations.\n\nDo you want to proceed?'
                        )
                      ) {
                        return
                      }
                    }

                    try {
                      await startTournamentMutation.mutateAsync({ tournamentId })
                      utils.tournament.getById.invalidate({ id: tournamentId })
                    } catch (error: unknown) {
                      const message = error instanceof Error ? error.message : 'Unknown error'

                      alert(`Cannot start tournament:\n${message}`)
                    }
                  }}
                  disabled={startTournamentMutation.isPending || !canStart}
                >
                  <Play className="h-4 w-4 mr-2" />
                  {startTournamentMutation.isPending ? 'Starting...' : 'Start Tournament'}
                </Button>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest updates for this tournament</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <ActivityItem
                    action="Team registered"
                    team="Phoenix Legends"
                    time="2 hours ago"
                  />
                  <ActivityItem
                    action="Registration approved"
                    team="Dragon Squad"
                    time="5 hours ago"
                  />
                  <ActivityItem
                    action="Tournament updated"
                    team="Settings changed"
                    time="1 day ago"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-4">
            <TournamentForm
              tournament={{
                id: tournament.id,
                name: tournament.name,
                description: tournament.description,
                game: tournament.game.id,
                format: tournament.format,
                maxTeams: tournament.maxTeams,
                startDate: tournament.startDate,
                endDate: tournament.endDate,
                registrationStart: tournament.registrationStart,
                registrationEnd: tournament.registrationEnd,
                rules: tournament.rules,
                prizePool: tournament.prizePool,
                banner: tournament.banner,
                status: tournament.status,
              }}
              mode="edit"
            />
          </TabsContent>

          {/* Registrations Tab */}
          <TabsContent value="registrations" className="space-y-4">
            <RegistrationsTab
              tournamentId={tournamentId}
              registrations={registrations}
              isLoading={registrationsLoading}
              onApprove={async (registrationId) => {
                await approveRegistrationMutation.mutateAsync({ registrationId })
                utils.tournament.getRegistrations.invalidate({ tournamentId })
                utils.tournament.getById.invalidate({ id: tournamentId })
              }}
              onReject={async (registrationId) => {
                await rejectRegistrationMutation.mutateAsync({ registrationId })
                utils.tournament.getRegistrations.invalidate({ tournamentId })
                utils.tournament.getById.invalidate({ id: tournamentId })
              }}
            />
          </TabsContent>

          {/* Bracket Tab */}
          <TabsContent value="bracket" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Tournament Bracket</CardTitle>
                    <CardDescription>View and manage the tournament bracket</CardDescription>
                  </div>
                  {tournament.brackets &&
                    tournament.brackets.length > 0 &&
                    tournament.status !== 'IN_PROGRESS' &&
                    tournament.status !== 'COMPLETED' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          if (
                            confirm(
                              'Are you sure you want to regenerate the bracket? This will clear the current bracket.'
                            )
                          ) {
                            try {
                              await regenerateBracketMutation.mutateAsync({ tournamentId })
                              utils.tournament.getById.invalidate({ id: tournamentId })
                            } catch (error: unknown) {
                              alert(error instanceof Error ? error.message : 'Something went wrong')
                            }
                          }
                        }}
                        disabled={regenerateBracketMutation.isPending}
                      >
                        <Trophy className="h-4 w-4 mr-2" />
                        {regenerateBracketMutation.isPending
                          ? 'Regenerating...'
                          : 'Regenerate Bracket'}
                      </Button>
                    )}
                </div>
              </CardHeader>
              <CardContent>
                {tournament.brackets && tournament.brackets.length > 0 ? (
                  <div className="space-y-6">
                    {tournament.brackets.map((bracket) => (
                      <div key={bracket.id} className="space-y-4">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">
                            {bracket.type === 'MAIN'
                              ? 'Main Bracket'
                              : bracket.type === 'WINNERS'
                                ? 'Winners Bracket'
                                : bracket.type === 'LOSERS'
                                  ? 'Losers Bracket'
                                  : 'Grand Final'}{' '}
                            - Round {bracket.round}
                          </h3>
                          <Badge variant="secondary">{bracket.matches?.length || 0} matches</Badge>
                        </div>
                        {bracket.matches && bracket.matches.length > 0 ? (
                          <div className="space-y-2">
                            {bracket.matches.map((match) => (
                              <div
                                key={match.id}
                                className="flex items-center justify-between p-3 border rounded-lg"
                              >
                                <div className="flex items-center gap-4 flex-1">
                                  <div className="flex-1">
                                    <p className="font-medium">{match.homeTeam?.name || 'TBD'}</p>
                                    {match.homeTeam?.tag && (
                                      <p className="text-sm text-muted-foreground">
                                        [{match.homeTeam.tag}]
                                      </p>
                                    )}
                                  </div>
                                  <div className="text-lg font-bold text-muted-foreground">VS</div>
                                  <div className="flex-1 text-right">
                                    <p className="font-medium">{match.awayTeam?.name || 'TBD'}</p>
                                    {match.awayTeam?.tag && (
                                      <p className="text-sm text-muted-foreground">
                                        [{match.awayTeam.tag}]
                                      </p>
                                    )}
                                  </div>
                                </div>
                                <Badge variant="outline" className="ml-4">
                                  {match.status}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            No matches in this round yet
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Trophy className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-lg font-medium mb-2">Bracket Not Generated</p>
                    <p className="text-sm text-muted-foreground mb-4">
                      {approvedCount < 2
                        ? `Need at least 2 approved teams to generate bracket (currently ${approvedCount})`
                        : 'Approve registrations and seed teams before generating the bracket'}
                    </p>
                    <Button
                      onClick={async () => {
                        try {
                          await generateBracketMutation.mutateAsync({ tournamentId })
                          utils.tournament.getById.invalidate({ id: tournamentId })
                        } catch (error: unknown) {
                          alert(error instanceof Error ? error.message : 'Something went wrong')
                        }
                      }}
                      disabled={generateBracketMutation.isPending || approvedCount < 2}
                    >
                      <Trophy className="h-4 w-4 mr-2" />
                      {generateBracketMutation.isPending ? 'Generating...' : 'Generate Bracket'}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Matches Tab */}
          <TabsContent value="matches" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Match Schedule</CardTitle>
                    <CardDescription>Manage and schedule tournament matches</CardDescription>
                  </div>
                  {tournament.brackets &&
                    tournament.brackets.some((b) => b.matches && b.matches.length > 0) && (
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Filter className="h-4 w-4 mr-2" />
                          Filter
                        </Button>
                      </div>
                    )}
                </div>
              </CardHeader>
              <CardContent>
                {tournament.brackets && tournament.brackets.length > 0 ? (
                  <div className="space-y-6">
                    {/* Loop through brackets */}
                    {tournament.brackets.map((bracket) => (
                      <div key={bracket.id} className="space-y-4">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-lg">
                            {bracket.type === 'MAIN'
                              ? 'Main Bracket'
                              : bracket.type === 'WINNERS'
                                ? 'Winners Bracket'
                                : bracket.type === 'LOSERS'
                                  ? 'Losers Bracket'
                                  : 'Grand Final'}{' '}
                            - Round {bracket.round}
                          </h3>
                          <Badge variant="secondary">{bracket.matches?.length || 0} matches</Badge>
                        </div>

                        {bracket.matches && bracket.matches.length > 0 ? (
                          <div className="space-y-3">
                            {bracket.matches.map((match) => (
                              <Card key={match.id} className="overflow-hidden">
                                <CardContent className="p-4">
                                  <div className="flex items-center justify-between gap-4">
                                    {/* Match Info */}
                                    <div className="flex items-center gap-4 flex-1">
                                      {/* Team 1 */}
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                          <p className="font-medium">
                                            {match.homeTeam?.name || 'TBD'}
                                          </p>
                                          {match.homeTeam?.id === match.winner?.id && (
                                            <Trophy className="h-4 w-4 text-yellow-500" />
                                          )}
                                        </div>
                                        {match.homeTeam?.tag && (
                                          <p className="text-sm text-muted-foreground">
                                            [{match.homeTeam.tag}]
                                          </p>
                                        )}
                                      </div>

                                      {/* Score */}
                                      <div className="text-center min-w-[80px]">
                                        {match.status === 'COMPLETED' ? (
                                          <div className="text-xl font-bold">
                                            {match.homeScore ?? 0} - {match.awayScore ?? 0}
                                          </div>
                                        ) : (
                                          <div className="text-lg font-bold text-muted-foreground">
                                            VS
                                          </div>
                                        )}
                                      </div>

                                      {/* Team 2 */}
                                      <div className="flex-1 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                          {match.winner?.id === match.awayTeamId && (
                                            <Trophy className="h-4 w-4 text-yellow-500" />
                                          )}
                                          <p className="font-medium">
                                            {match.awayTeam?.name || 'TBD'}
                                          </p>
                                        </div>
                                        {match.awayTeam?.tag && (
                                          <p className="text-sm text-muted-foreground">
                                            [{match.awayTeam.tag}]
                                          </p>
                                        )}
                                      </div>
                                    </div>

                                    {/* Match Details & Actions */}
                                    <div className="flex items-center gap-3">
                                      {/* Schedule Info */}
                                      <div className="text-sm text-muted-foreground text-right min-w-[120px]">
                                        {match.scheduledAt && (
                                          <>
                                            <div className="flex items-center justify-end gap-1">
                                              <Calendar className="h-3 w-3" />
                                              {new Date(match.scheduledAt).toLocaleDateString()}
                                            </div>
                                            <div className="flex items-center justify-end gap-1">
                                              <Clock className="h-3 w-3" />
                                              {new Date(match.scheduledAt).toLocaleTimeString([], {
                                                hour: '2-digit',
                                                minute: '2-digit',
                                              })}
                                            </div>
                                          </>
                                        )}
                                      </div>

                                      {/* Status Badge */}
                                      <Badge
                                        variant={
                                          match.status === 'COMPLETED'
                                            ? 'default'
                                            : match.status === 'IN_PROGRESS'
                                              ? 'secondary'
                                              : match.status === 'SCHEDULED'
                                                ? 'outline'
                                                : 'secondary'
                                        }
                                        className="min-w-[100px] justify-center"
                                      >
                                        {match.status}
                                      </Badge>

                                      {/* Actions */}
                                      {match.status !== 'COMPLETED' && (
                                        <DropdownMenu>
                                          <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="sm">
                                              <MoreVertical className="h-4 w-4" />
                                            </Button>
                                          </DropdownMenuTrigger>
                                          <DropdownMenuContent align="end">
                                            {!match.scheduledAt && (
                                              <DropdownMenuItem
                                                onClick={() => {
                                                  // TODO: Open schedule modal
                                                  console.log('Schedule match:', match.id)
                                                }}
                                              >
                                                <Calendar className="h-4 w-4 mr-2" />
                                                Schedule Match
                                              </DropdownMenuItem>
                                            )}
                                            {match.homeTeamId && match.awayTeamId && (
                                              <DropdownMenuItem
                                                onClick={() => {
                                                  // TODO: Open report result modal
                                                  console.log('Report result:', match.id)
                                                }}
                                              >
                                                <Trophy className="h-4 w-4 mr-2" />
                                                Report Result
                                              </DropdownMenuItem>
                                            )}
                                            {match.scheduledAt && match.status === 'SCHEDULED' && (
                                              <DropdownMenuItem
                                                onClick={() => {
                                                  // TODO: Edit schedule
                                                  console.log('Edit schedule:', match.id)
                                                }}
                                              >
                                                <Clock className="h-4 w-4 mr-2" />
                                                Edit Schedule
                                              </DropdownMenuItem>
                                            )}
                                          </DropdownMenuContent>
                                        </DropdownMenu>
                                      )}
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            No matches in this bracket yet
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Calendar className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-lg font-medium mb-2">No Matches Yet</p>
                    <p className="text-sm text-muted-foreground">
                      Generate the bracket first to create matches
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}

// Stat Card Component
function StatCard({ title, value, icon }: { title: string; value: string; icon: React.ReactNode }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  )
}

// Activity Item Component
function ActivityItem({ action, team, time }: { action: string; team: string; time: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b last:border-0">
      <div>
        <p className="text-sm font-medium">{action}</p>
        <p className="text-xs text-muted-foreground">{team}</p>
      </div>
      <span className="text-xs text-muted-foreground">{time}</span>
    </div>
  )
}

// Registrations Tab Component
function RegistrationsTab({
  registrations,
  isLoading,
  onApprove,
  onReject,
}: {
  tournamentId: string
  registrations?: Array<{
    id: string
    status: string
    seed?: number | null
    registeredAt: Date | string
    team: {
      id: string
      name: string
      tag?: string | null
      logo?: string | null
    }
  }>
  isLoading: boolean
  onApprove: (registrationId: string) => Promise<void>
  onReject: (registrationId: string) => Promise<void>
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Team Registrations</CardTitle>
        <CardDescription>Approve or reject team registration requests</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20" />
            ))}
          </div>
        ) : !registrations || registrations.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">No team registrations yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {registrations.map((registration) => (
              <div
                key={registration.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex-1">
                  <p className="font-medium">{registration.team.name}</p>
                  <p className="text-sm text-muted-foreground">
                    Registered {new Date(registration.registeredAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {registration.status === 'APPROVED' ? (
                    <Badge variant="outline" className="bg-green-500/10 text-green-500">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Approved
                    </Badge>
                  ) : registration.status === 'REJECTED' ? (
                    <Badge variant="outline" className="bg-red-500/10 text-red-500">
                      <XCircle className="h-3 w-3 mr-1" />
                      Rejected
                    </Badge>
                  ) : (
                    <>
                      <Button size="sm" variant="outline" onClick={() => onReject(registration.id)}>
                        <XCircle className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                      <Button size="sm" onClick={() => onApprove(registration.id)}>
                        <CheckCircle2 className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
