'use client'

import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Users, CheckCircle2, XCircle } from 'lucide-react'
import { trpc } from '@/lib/trpc/client'
import { cn } from '@/lib/utils'
import {
  getRegistrationStatusForTeam,
  isTeamBlockedFromQuickAdd,
  quickAddStatusBadge,
} from '@/lib/tournament-team-search'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

export function TournamentManageRegistrationsTab({
  registrations,
  isLoading,
  onApprove,
  onReject,
  tournamentId,
  gameId,
  canAddTeams,
}: {
  tournamentId: string
  gameId: string
  canAddTeams: boolean
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
  const utils = trpc.useUtils()
  const [teamSearch, setTeamSearch] = useState('')
  const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>([])
  const [debouncedTeamSearch, setDebouncedTeamSearch] = useState(teamSearch)

  useEffect(() => {
    const t = setTimeout(() => setDebouncedTeamSearch(teamSearch), 350)
    return () => clearTimeout(t)
  }, [teamSearch])

  useEffect(() => {
    setSelectedTeamIds((prev) =>
      prev.filter((id) => !isTeamBlockedFromQuickAdd(getRegistrationStatusForTeam(registrations, id))),
    )
  }, [registrations])

  const { data: teams, isLoading: teamsLoading } = trpc.team.getAll.useQuery(
    {
      game: gameId,
      search: debouncedTeamSearch || undefined,
      limit: 10,
    },
    { enabled: canAddTeams },
  )
  const hasTeams = (teams?.teams?.length ?? 0) > 0
  const showTeamsSkeleton = teamsLoading && !hasTeams

  const addTeamMutation = trpc.tournament.addTeamToTournament.useMutation({
    onSuccess: async () => {
      setTeamSearch('')
      setSelectedTeamIds([])
      await utils.tournament.getRegistrations.invalidate({ tournamentId })
    },
  })

  const addTeamsMutation = trpc.tournament.addTeamsToTournament.useMutation({
    onSuccess: async () => {
      setTeamSearch('')
      setSelectedTeamIds([])
      await utils.tournament.getRegistrations.invalidate({ tournamentId })
    },
  })

  const addableSelectedIds = useMemo(
    () =>
      selectedTeamIds.filter(
        (id) => !isTeamBlockedFromQuickAdd(getRegistrationStatusForTeam(registrations, id)),
      ),
    [selectedTeamIds, registrations],
  )

  return (
    <div className='space-y-4'>
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Users className='h-4 w-4' />
            Add Team
          </CardTitle>
          <CardDescription>Select teams to add to this tournament.</CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='flex gap-3'>
            <Input
              placeholder='Search by team name or tag...'
              value={teamSearch}
              onChange={(e) => setTeamSearch(e.target.value)}
              disabled={!canAddTeams || addTeamMutation.isPending}
            />
          </div>

          {!canAddTeams ? (
            <p className='text-sm text-muted-foreground'>
              Team intake is only available while the tournament is in <strong>registration</strong>. After
              registration closes, seeding, or play begins, new teams can&apos;t be added—create a new
              tournament if you need a different lineup.
            </p>
          ) : showTeamsSkeleton ? (
            <div className='space-y-3'>
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className='h-16 w-full' />
              ))}
            </div>
          ) : (teams?.teams?.length || 0) === 0 ? (
            <p className='text-sm text-muted-foreground'>No teams found.</p>
          ) : (
            <div className='space-y-2'>
              {teams?.teams.map((team) => {
                const checked = selectedTeamIds.includes(team.id)
                const regStatus = getRegistrationStatusForTeam(registrations, team.id)
                const blocked = isTeamBlockedFromQuickAdd(regStatus)
                const statusBadge = quickAddStatusBadge(regStatus)

                return (
                  <div
                    key={team.id}
                    className={cn(
                      'flex items-center justify-between gap-3 p-3 border rounded-lg',
                      blocked && 'bg-muted/40',
                    )}
                  >
                    <div className='flex items-center gap-3 min-w-0'>
                      <input
                        type='checkbox'
                        className='h-4 w-4 rounded border-border text-primary focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50'
                        checked={checked}
                        disabled={blocked}
                        onChange={() => {
                          setSelectedTeamIds((prev) =>
                            prev.includes(team.id)
                              ? prev.filter((id) => id !== team.id)
                              : [...prev, team.id],
                          )
                        }}
                      />
                      <Avatar className='h-10 w-10 shrink-0'>
                        <AvatarImage src={team.logo || undefined} />
                        <AvatarFallback>{team.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className='min-w-0 flex-1'>
                        <div className='flex flex-wrap items-center gap-2 min-w-0'>
                          <p className='font-medium truncate'>{team.name}</p>
                          {statusBadge && (
                            <Badge variant={statusBadge.variant} className='shrink-0 font-normal'>
                              {statusBadge.label}
                            </Badge>
                          )}
                        </div>
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
                      disabled={addTeamMutation.isPending || blocked}
                    >
                      {addTeamMutation.isPending ? 'Adding...' : 'Add'}
                    </Button>
                  </div>
                )
              })}

              {addableSelectedIds.length > 0 && (
                <div className='flex justify-end pt-2'>
                  <Button
                    onClick={() =>
                      addTeamsMutation.mutate({
                        tournamentId,
                        teamIds: addableSelectedIds,
                      })
                    }
                    disabled={addTeamsMutation.isPending}
                  >
                    {addTeamsMutation.isPending
                      ? 'Adding...'
                      : `Add selected (${addableSelectedIds.length})`}
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Team Registrations</CardTitle>
          <CardDescription>Approve or reject team registration requests</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className='space-y-4'>
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className='h-20' />
              ))}
            </div>
          ) : !registrations || registrations.length === 0 ? (
            <div className='text-center py-8'>
              <p className='text-sm text-muted-foreground'>No team registrations yet</p>
            </div>
          ) : (
            <div className='space-y-4'>
              {registrations.map((registration) => (
                <div
                  key={registration.id}
                  className='flex items-center justify-between p-4 border rounded-lg'
                >
                  <div className='flex-1'>
                    <p className='font-medium'>{registration.team.name}</p>
                    <p className='text-sm text-muted-foreground'>
                      Registered {new Date(registration.registeredAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className='flex items-center gap-3'>
                    {registration.status === 'APPROVED' ? (
                      <Badge variant='outline' className='bg-green-500/10 text-green-500'>
                        <CheckCircle2 className='h-3 w-3 mr-1' />
                        Approved
                      </Badge>
                    ) : registration.status === 'REJECTED' ? (
                      <Badge variant='outline' className='bg-red-500/10 text-red-500'>
                        <XCircle className='h-3 w-3 mr-1' />
                        Rejected
                      </Badge>
                    ) : (
                      <>
                        <Button size='sm' variant='outline' onClick={() => onReject(registration.id)}>
                          <XCircle className='h-4 w-4 mr-1' />
                          Reject
                        </Button>
                        <Button size='sm' onClick={() => onApprove(registration.id)}>
                          <CheckCircle2 className='h-4 w-4 mr-1' />
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
    </div>
  )
}
