'use client'

import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import {
  getRegistrationStatusForTeam,
  isTeamBlockedFromQuickAdd,
} from '@/lib/tournament-team-search'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  ArrowLeft,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  Users,
} from 'lucide-react'
import { trpc } from '@/lib/trpc/client'
import { RegistrationActionDialog } from '@/components/dashboard/tournament-registrations/registration-action-dialog'
import {
  PendingRegistrationsTab,
  RegistrationListTab,
} from '@/components/dashboard/tournament-registrations/registration-list-tab'
import { TeamQuickAddPanel } from '@/components/dashboard/tournament-registrations/team-quick-add-panel'
import type { ActionDialogState, RegistrationType } from '@/components/dashboard/tournament-registrations/types'

export default function TournamentRegistrationsPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const tournamentId = params.id as string

  const [actionDialog, setActionDialog] = useState<ActionDialogState>({
    open: false,
    type: null,
    registrationId: null,
    teamName: null,
  })

  const [teamSearch, setTeamSearch] = useState('')
  const [debouncedTeamSearch, setDebouncedTeamSearch] = useState('')
  const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>([])

  useEffect(() => {
    const t = setTimeout(() => setDebouncedTeamSearch(teamSearch), 350)
    return () => clearTimeout(t)
  }, [teamSearch])

  const { data: tournament, isLoading: tournamentLoading } = trpc.tournament.getManageOverviewById.useQuery(
    { id: tournamentId },
    { enabled: !!tournamentId && !!session },
  )

  const { data: registrations, isLoading, refetch } = trpc.tournament.getRegistrations.useQuery(
    { tournamentId },
    { enabled: !!tournamentId },
  )

  const canAddTeams = tournament?.status === 'REGISTRATION'
  const trimmedSearch = debouncedTeamSearch.trim()
  const tournamentGameId = tournament?.game?.id

  const { data: teams, isLoading: teamsLoading } = trpc.team.getAll.useQuery(
    {
      game: tournamentGameId,
      search: trimmedSearch || undefined,
      limit: 20,
    },
    { enabled: !!tournamentGameId && canAddTeams },
  )

  const addTeamMutation = trpc.tournament.addTeamToTournament.useMutation({
    onSuccess: () => {
      refetch()
      setTeamSearch('')
      setDebouncedTeamSearch('')
    },
  })

  const addTeamsMutation = trpc.tournament.addTeamsToTournament.useMutation({
    onSuccess: () => {
      refetch()
      setTeamSearch('')
      setDebouncedTeamSearch('')
      setSelectedTeamIds([])
    },
  })

  useEffect(() => {
    setSelectedTeamIds((prev) =>
      prev.filter(
        (id) => !isTeamBlockedFromQuickAdd(getRegistrationStatusForTeam(registrations, id)),
      ),
    )
  }, [registrations])

  const addableSelectedIds = useMemo(
    () =>
      selectedTeamIds.filter(
        (id) => !isTeamBlockedFromQuickAdd(getRegistrationStatusForTeam(registrations, id)),
      ),
    [selectedTeamIds, registrations],
  )

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

  const openActionDialog = (
    type: 'approve' | 'reject',
    registration: RegistrationType,
  ) => {
    setActionDialog({
      open: true,
      type,
      registrationId: registration.id,
      teamName: registration.team.name,
    })
  }

  if (!session) {
    router.push('/login')
    return null
  }

  const isOrganizer = session.user.id === tournament?.organizerId
  const isAdmin = session.user.role === 'ADMIN'

  if (tournamentLoading || !tournament) {
    return (
      <div className='space-y-6'>
        <Skeleton className='h-12 w-96' />
        <Skeleton className='h-64' />
      </div>
    )
  }

  if (!isOrganizer && !isAdmin) {
    return (
      <Alert variant='destructive'>
        <AlertCircle className='h-4 w-4' />
        <AlertDescription>
          You don&apos;t have permission to manage registrations for this tournament.
        </AlertDescription>
      </Alert>
    )
  }

  const pendingRegistrations = registrations?.filter((r) => r.status === 'PENDING') || []
  const approvedRegistrations = registrations?.filter((r) => r.status === 'APPROVED') || []
  const rejectedRegistrations = registrations?.filter((r) => r.status === 'REJECTED') || []

  return (
    <>
      <div className='space-y-6'>
        <div className='flex items-center gap-4'>
          <Link href={`/tournaments/${tournamentId}`}>
            <Button variant='ghost' size='icon'>
              <ArrowLeft className='h-4 w-4' />
            </Button>
          </Link>
          <div>
            <h1 className='text-3xl font-bold tracking-tight'>Manage Registrations</h1>
            <p className='text-muted-foreground mt-2'>{tournament?.name || 'Loading...'}</p>
          </div>
        </div>

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

        <TeamQuickAddPanel
          canAddTeams={canAddTeams}
          teamSearch={teamSearch}
          onTeamSearchChange={setTeamSearch}
          trimmedSearch={trimmedSearch}
          teams={teams?.teams}
          teamsLoading={teamsLoading}
          registrations={registrations}
          selectedTeamIds={selectedTeamIds}
          onSelectedTeamIdsChange={setSelectedTeamIds}
          addableSelectedIds={addableSelectedIds}
          onAddTeam={(teamId) =>
            addTeamMutation.mutate({ tournamentId, teamId })
          }
          onAddSelectedTeams={(teamIds) =>
            addTeamsMutation.mutate({ tournamentId, teamIds })
          }
          isAddTeamPending={addTeamMutation.isPending}
          isAddTeamsPending={addTeamsMutation.isPending}
        />

        <Tabs defaultValue='pending'>
          <TabsList>
            <TabsTrigger value='pending'>Pending ({pendingRegistrations.length})</TabsTrigger>
            <TabsTrigger value='approved'>Approved ({approvedRegistrations.length})</TabsTrigger>
            <TabsTrigger value='rejected'>Rejected ({rejectedRegistrations.length})</TabsTrigger>
            <TabsTrigger value='all'>All ({registrations?.length || 0})</TabsTrigger>
          </TabsList>

          <TabsContent value='pending' className='mt-6'>
            <PendingRegistrationsTab
              registrations={pendingRegistrations}
              isLoading={isLoading}
              onApprove={(registration) => openActionDialog('approve', registration)}
              onReject={(registration) => openActionDialog('reject', registration)}
            />
          </TabsContent>

          <TabsContent value='approved' className='mt-6'>
            <RegistrationListTab registrations={approvedRegistrations} isLoading={isLoading} />
          </TabsContent>

          <TabsContent value='rejected' className='mt-6'>
            <RegistrationListTab registrations={rejectedRegistrations} isLoading={isLoading} />
          </TabsContent>

          <TabsContent value='all' className='mt-6'>
            <RegistrationListTab registrations={registrations || []} isLoading={isLoading} />
          </TabsContent>
        </Tabs>
      </div>

      <RegistrationActionDialog
        actionDialog={actionDialog}
        onOpenChange={(open) => setActionDialog({ ...actionDialog, open })}
        onConfirm={handleAction}
        isPending={approveMutation.isPending || rejectMutation.isPending}
      />
    </>
  )
}
