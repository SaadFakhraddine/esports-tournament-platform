'use client'

import { cn } from '@/lib/utils'
import {
  getRegistrationStatusForTeam,
  isTeamBlockedFromQuickAdd,
  quickAddStatusBadge,
} from '@/lib/tournament-team-search'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Users } from 'lucide-react'
import type { RegistrationType } from './types'

type TeamSearchResult = {
  id: string
  name: string
  tag?: string | null
  logo?: string | null
}

type TeamQuickAddPanelProps = {
  canAddTeams: boolean
  teamSearch: string
  onTeamSearchChange: (value: string) => void
  trimmedSearch: string
  teams: TeamSearchResult[] | undefined
  teamsLoading: boolean
  registrations: RegistrationType[] | undefined
  selectedTeamIds: string[]
  onSelectedTeamIdsChange: (ids: string[]) => void
  addableSelectedIds: string[]
  onAddTeam: (teamId: string) => void
  onAddSelectedTeams: (teamIds: string[]) => void
  isAddTeamPending: boolean
  isAddTeamsPending: boolean
}

export function TeamQuickAddPanel({
  canAddTeams,
  teamSearch,
  onTeamSearchChange,
  trimmedSearch,
  teams,
  teamsLoading,
  registrations,
  selectedTeamIds,
  onSelectedTeamIdsChange,
  addableSelectedIds,
  onAddTeam,
  onAddSelectedTeams,
  isAddTeamPending,
  isAddTeamsPending,
}: TeamQuickAddPanelProps) {
  return (
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
            onChange={(e) => onTeamSearchChange(e.target.value)}
            disabled={!canAddTeams || isAddTeamPending}
          />
        </div>

        {!canAddTeams ? (
          <Alert>
            <AlertDescription>
              Team intake is only available while the tournament is in <strong>registration</strong>.
              After registration closes, seeding, or play begins, new teams can&apos;t be added—create a
              new tournament if you need a different lineup.
            </AlertDescription>
          </Alert>
        ) : teamsLoading ? (
          <div className='space-y-3'>
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className='h-16 w-full' />
            ))}
          </div>
        ) : (teams?.length || 0) === 0 ? (
          <p className='text-sm text-muted-foreground'>
            {trimmedSearch
              ? `No teams match "${trimmedSearch}" for this tournament's game.`
              : 'No teams are registered for this game yet. Create teams from the Teams page first.'}
          </p>
        ) : (
          <div className='space-y-2'>
            <div className='space-y-2'>
              {teams?.map((team) => {
                const checked = selectedTeamIds.includes(team.id)
                const regStatus = getRegistrationStatusForTeam(registrations, team.id)
                const blocked = !canAddTeams || isTeamBlockedFromQuickAdd(regStatus)
                const statusBadge = quickAddStatusBadge(regStatus)
                return (
                  <div
                    key={team.id}
                    className={cn(
                      'flex items-center justify-between gap-3 p-3 border rounded-lg',
                      canAddTeams && isTeamBlockedFromQuickAdd(regStatus) && 'bg-muted/40',
                    )}
                  >
                    <div className='flex items-center gap-3 min-w-0'>
                      <input
                        type='checkbox'
                        className='h-4 w-4 rounded border-border text-primary focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50'
                        checked={checked}
                        disabled={blocked}
                        onChange={() => {
                          onSelectedTeamIdsChange(
                            selectedTeamIds.includes(team.id)
                              ? selectedTeamIds.filter((id) => id !== team.id)
                              : [...selectedTeamIds, team.id],
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
                        onAddTeam(team.id)
                      }
                      disabled={isAddTeamPending || blocked}
                    >
                      {isAddTeamPending ? 'Adding...' : 'Add'}
                    </Button>
                  </div>
                )
              })}
            </div>

            {addableSelectedIds.length > 0 && (
              <div className='flex justify-end pt-2'>
                <Button
                  onClick={() => onAddSelectedTeams(addableSelectedIds)}
                  disabled={isAddTeamsPending || !canAddTeams}
                >
                  {isAddTeamsPending
                    ? 'Adding...'
                    : `Add selected (${addableSelectedIds.length})`}
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
