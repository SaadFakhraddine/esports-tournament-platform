'use client'

import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { useState } from 'react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  ArrowLeft,
  Check,
  X,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  Users,
  Loader2,
} from 'lucide-react'
import { trpc } from '@/lib/trpc/client'
import { format } from 'date-fns'

export default function TournamentRegistrationsPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const tournamentId = params.id as string

  const [actionDialog, setActionDialog] = useState<{
    open: boolean
    type: 'approve' | 'reject' | null
    registrationId: string | null
    teamName: string | null
  }>({
    open: false,
    type: null,
    registrationId: null,
    teamName: null,
  })

  const [teamSearch, setTeamSearch] = useState('')
  const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>([])

  const { data: tournament, isLoading: tournamentLoading } = trpc.tournament.getById.useQuery(
    { id: tournamentId },
    { enabled: !!tournamentId }
  )

  const { data: registrations, isLoading, refetch } = trpc.tournament.getRegistrations.useQuery(
    { tournamentId },
    { enabled: !!tournamentId }
  )

  const { data: teams, isLoading: teamsLoading } = trpc.team.getAll.useQuery(
    {
      game: tournament?.game?.id,
      search: teamSearch || undefined,
      limit: 5,
    },
    { enabled: !!tournament }
  )

  const addTeamMutation = trpc.tournament.addTeamToTournament.useMutation({
    onSuccess: () => {
      refetch()
      setTeamSearch('')
    },
  })

  const addTeamsMutation = trpc.tournament.addTeamsToTournament.useMutation({
    onSuccess: () => {
      refetch()
      setTeamSearch('')
      setSelectedTeamIds([])
    },
  })

  const canAddTeams = tournament?.status === 'REGISTRATION'

  const approveMutation = trpc.tournament.approveRegistration.useMutation({
    onSuccess: () => {
      refetch()
      setActionDialog({ open: false, type: null, registrationId: null, teamName: null })
    },
  })

  const rejectMutation = trpc.tournament.rejectRegistration.useMutation({
    onSuccess: () => {
      refetch()
      setActionDialog({ open: false, type: null, registrationId: null, teamName: null })
    },
  })

  const handleAction = () => {
    if (!actionDialog.registrationId) return

    if (actionDialog.type === 'approve') {
      approveMutation.mutate({ registrationId: actionDialog.registrationId })
    } else if (actionDialog.type === 'reject') {
      rejectMutation.mutate({ registrationId: actionDialog.registrationId })
    }
  }

  if (!session) {
    router.push('/login')
    return null
  }

  const isOrganizer = session.user.id === tournament?.organizer?.id
  const isAdmin = session.user.role === 'ADMIN'

  if (tournamentLoading || !tournament) {
    return (
      <DashboardLayout userRole={session.user.role}>
        <div className='space-y-6'>
          <Skeleton className='h-12 w-96' />
          <Skeleton className='h-64' />
        </div>
      </DashboardLayout>
    )
  }

  if (!isOrganizer && !isAdmin) {
    return (
      <DashboardLayout userRole={session.user.role}>
        <Alert variant='destructive'>
          <AlertCircle className='h-4 w-4' />
          <AlertDescription>
            You don&apos;t have permission to manage registrations for this tournament.
          </AlertDescription>
        </Alert>
      </DashboardLayout>
    )
  }

  const pendingRegistrations = registrations?.filter((r) => r.status === 'PENDING') || []
  const approvedRegistrations = registrations?.filter((r) => r.status === 'APPROVED') || []
  const rejectedRegistrations = registrations?.filter((r) => r.status === 'REJECTED') || []

  return (
    <DashboardLayout userRole={session.user.role}>
      <div className='space-y-6'>
        {/* Header */}
        <div className='flex items-center gap-4'>
          <Link href={`/tournaments/${tournamentId}`}>
            <Button variant='ghost' size='icon'>
              <ArrowLeft className='h-4 w-4' />
            </Button>
          </Link>
          <div>
            <h1 className='text-3xl font-bold tracking-tight'>Manage Registrations</h1>
            <p className='text-muted-foreground mt-2'>
              {tournament?.name || 'Loading...'}
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className='grid gap-4 md:grid-cols-4'>
          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>Total</CardTitle>
              <Users className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>{registrations?.length || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>Pending</CardTitle>
              <Clock className='h-4 w-4 text-yellow-500' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>{pendingRegistrations.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>Approved</CardTitle>
              <CheckCircle className='h-4 w-4 text-green-500' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>{approvedRegistrations.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>Rejected</CardTitle>
              <XCircle className='h-4 w-4 text-red-500' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>{rejectedRegistrations.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Add Team (Organizer/Admin) */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Users className='h-4 w-4' />
              Add Team
            </CardTitle>
            <CardDescription>Select a team to add to this tournament.</CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='flex gap-3'>
              <Input
                placeholder='Search by team name or tag...'
                value={teamSearch}
                onChange={(e) => setTeamSearch(e.target.value)}
                disabled={!canAddTeams || addTeamMutation.isPending || teamsLoading}
              />
            </div>

            {!canAddTeams ? (
              <Alert variant='destructive'>
                <AlertDescription>This tournament is not open for adding teams.</AlertDescription>
              </Alert>
            ) : teamsLoading ? (
              <div className='space-y-3'>
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className='h-16 w-full' />
                ))}
              </div>
            ) : (teams?.teams?.length || 0) === 0 ? (
              <p className='text-sm text-muted-foreground'>No teams found.</p>
            ) : (
              <div className='space-y-2'>
                <div className='space-y-2'>
                  {teams?.teams.map((team) => {
                    const checked = selectedTeamIds.includes(team.id)
                    return (
                      <div
                        key={team.id}
                        className='flex items-center justify-between gap-3 p-3 border rounded-lg'
                      >
                        <div className='flex items-center gap-3 min-w-0'>
                          <input
                            type='checkbox'
                            className='h-4 w-4 rounded border-border text-primary focus:ring-ring'
                            checked={checked}
                            disabled={!canAddTeams}
                            onChange={() => {
                              setSelectedTeamIds((prev) =>
                                prev.includes(team.id)
                                  ? prev.filter((id) => id !== team.id)
                                  : [...prev, team.id]
                              )
                            }}
                          />
                          <Avatar className='h-10 w-10 shrink-0'>
                            <AvatarImage src={team.logo || undefined} />
                            <AvatarFallback>{team.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className='min-w-0'>
                            <p className='font-medium truncate'>{team.name}</p>
                            {team.tag && (
                              <p className='text-xs text-muted-foreground truncate'>[{team.tag}]</p>
                            )}
                          </div>
                        </div>
                        <Button
                          size='sm'
                          onClick={() =>
                            addTeamMutation.mutate({
                              tournamentId,
                              teamId: team.id,
                            })
                          }
                          disabled={addTeamMutation.isPending || !canAddTeams}
                        >
                          {addTeamMutation.isPending ? 'Adding...' : 'Add'}
                        </Button>
                      </div>
                    )
                  })}
                </div>

                {selectedTeamIds.length > 0 && (
                  <div className='flex justify-end pt-2'>
                    <Button
                      onClick={() =>
                        addTeamsMutation.mutate({
                          tournamentId,
                          teamIds: selectedTeamIds,
                        })
                      }
                      disabled={addTeamsMutation.isPending || !canAddTeams}
                    >
                      {addTeamsMutation.isPending
                        ? 'Adding...'
                        : `Add selected (${selectedTeamIds.length})`}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue='pending'>
          <TabsList>
            <TabsTrigger value='pending'>
              Pending ({pendingRegistrations.length})
            </TabsTrigger>
            <TabsTrigger value='approved'>
              Approved ({approvedRegistrations.length})
            </TabsTrigger>
            <TabsTrigger value='rejected'>
              Rejected ({rejectedRegistrations.length})
            </TabsTrigger>
            <TabsTrigger value='all'>All ({registrations?.length || 0})</TabsTrigger>
          </TabsList>

          <TabsContent value='pending' className='mt-6'>
            <Card>
              <CardHeader>
                <CardTitle>Pending Approval</CardTitle>
                <CardDescription>
                  Review and approve or reject team registrations
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className='space-y-4'>
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className='h-20 w-full' />
                    ))}
                  </div>
                ) : pendingRegistrations.length === 0 ? (
                  <div className='text-center py-8 text-muted-foreground'>
                    <Clock className='h-12 w-12 mx-auto mb-2 opacity-50' />
                    <p>No pending registrations</p>
                  </div>
                ) : (
                  <div className='space-y-4'>
                    {pendingRegistrations.map((registration) => (
                      <RegistrationCard
                        key={registration.id}
                        registration={registration}
                        onApprove={() =>
                          setActionDialog({
                            open: true,
                            type: 'approve',
                            registrationId: registration.id,
                            teamName: registration.team.name,
                          })
                        }
                        onReject={() =>
                          setActionDialog({
                            open: true,
                            type: 'reject',
                            registrationId: registration.id,
                            teamName: registration.team.name,
                          })
                        }
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value='approved' className='mt-6'>
            <RegistrationList registrations={approvedRegistrations} isLoading={isLoading} />
          </TabsContent>

          <TabsContent value='rejected' className='mt-6'>
            <RegistrationList registrations={rejectedRegistrations} isLoading={isLoading} />
          </TabsContent>

          <TabsContent value='all' className='mt-6'>
            <RegistrationList registrations={registrations || []} isLoading={isLoading} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={actionDialog.open} onOpenChange={(open) => setActionDialog({ ...actionDialog, open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionDialog.type === 'approve' ? 'Approve' : 'Reject'} Registration
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to {actionDialog.type} the registration for{' '}
              <span className='font-semibold'>{actionDialog.teamName}</span>?
              {actionDialog.type === 'reject' && ' This action can be undone later.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={approveMutation.isPending || rejectMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleAction}
              disabled={approveMutation.isPending || rejectMutation.isPending}
              className={actionDialog.type === 'reject' ? 'bg-destructive hover:bg-destructive/90' : ''}
            >
              {(approveMutation.isPending || rejectMutation.isPending) && (
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
              )}
              {actionDialog.type === 'approve' ? 'Approve' : 'Reject'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  )
}

type RegistrationType = {
  id: string
  seed?: number | null
  status: string
  registeredAt: Date | string
  team: {
    id: string
    name: string
    tag?: string | null
    logo?: string | null
  }
}

function RegistrationCard({
  registration,
  onApprove,
  onReject,
}: {
  registration: RegistrationType
  onApprove?: () => void
  onReject?: () => void
}) {
  return (
    <div className='flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors'>
      <div className='flex items-center gap-4'>
        {registration.seed && (
          <div className='flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 border-2 border-primary/20 font-bold text-primary'>
            {registration.seed}
          </div>
        )}
        <Avatar className='h-12 w-12'>
          <AvatarImage src={registration.team.logo || undefined} />
          <AvatarFallback>{registration.team.name.charAt(0)}</AvatarFallback>
        </Avatar>
        <div>
          <div className='flex items-center gap-2'>
            <p className='font-medium'>{registration.team.name}</p>
            {!registration.seed && registration.status === 'APPROVED' && (
              <Badge variant='outline' className='text-xs'>Not seeded</Badge>
            )}
          </div>
          {registration.team.tag && (
            <p className='text-sm text-muted-foreground'>[{registration.team.tag}]</p>
          )}
          <p className='text-xs text-muted-foreground'>
            Registered {format(new Date(registration.registeredAt), 'MMM d, yyyy')}
          </p>
        </div>
      </div>
      <div className='flex items-center gap-2'>
        <Badge
          variant='outline'
          className={
            registration.status === 'PENDING'
              ? 'bg-yellow-500/10 text-yellow-500'
              : registration.status === 'APPROVED'
              ? 'bg-green-500/10 text-green-500'
              : 'bg-red-500/10 text-red-500'
          }
        >
          {registration.status}
        </Badge>
        {onApprove && onReject && (
          <div className='flex gap-2'>
            <Button size='sm' variant='outline' className='text-green-500 hover:bg-green-500/10' onClick={onApprove}>
              <Check className='h-4 w-4' />
            </Button>
            <Button size='sm' variant='outline' className='text-red-500 hover:bg-red-500/10' onClick={onReject}>
              <X className='h-4 w-4' />
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

function RegistrationList({ registrations, isLoading }: { registrations: RegistrationType[]; isLoading: boolean }) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className='pt-6'>
          <div className='space-y-4'>
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className='h-20 w-full' />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (registrations.length === 0) {
    return (
      <Card>
        <CardContent className='pt-6'>
          <div className='text-center py-8 text-muted-foreground'>
            <Users className='h-12 w-12 mx-auto mb-2 opacity-50' />
            <p>No registrations found</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className='pt-6'>
        <div className='space-y-4'>
          {registrations.map((registration) => (
            <RegistrationCard key={registration.id} registration={registration} />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
