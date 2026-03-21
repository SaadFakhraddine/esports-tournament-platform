'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Calendar, Clock, Filter, MoreVertical, Play, Trophy, XCircle } from 'lucide-react'
import type { inferRouterOutputs } from '@trpc/server'
import type { AppRouter } from '@/server/api/root'

type BracketTree = inferRouterOutputs<AppRouter>['tournament']['getBracketTree']
type BracketMatch = NonNullable<BracketTree['brackets']>[number]['matches'][number]

export function TournamentManageMatchesTab({
  bracketTree,
  bracketTreeLoading,
  openScheduleDialog,
  clearMatchScheduleFromRow,
  startMatch,
  cancelMatch,
  openReportDialog,
}: {
  bracketTree: BracketTree | undefined
  bracketTreeLoading: boolean
  openScheduleDialog: (match: { id: string; scheduledAt: Date | string | null | undefined }) => void
  clearMatchScheduleFromRow: (matchId: string) => void | Promise<void>
  startMatch: (matchId: string) => void | Promise<void>
  cancelMatch: (matchId: string) => void | Promise<void>
  openReportDialog: (match: BracketMatch) => void
}) {
  return (
    <Card>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <div>
            <CardTitle>Match Schedule</CardTitle>
            <CardDescription>Manage and schedule tournament matches</CardDescription>
          </div>
          {bracketTree?.brackets?.some((b) => b.matches && b.matches.length > 0) && (
            <div className='flex gap-2'>
              <Button variant='outline' size='sm'>
                <Filter className='h-4 w-4 mr-2' />
                Filter
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {bracketTreeLoading ? (
          <Skeleton className='h-96 w-full' />
        ) : bracketTree?.brackets?.length ? (
          <div className='space-y-6'>
            {bracketTree?.brackets?.map((bracket) => (
              <div key={bracket.id} className='space-y-4'>
                <div className='flex items-center gap-2'>
                  <h3 className='font-semibold text-lg'>
                    {bracket.type === 'MAIN'
                      ? 'Main Bracket'
                      : bracket.type === 'WINNERS'
                        ? 'Winners Bracket'
                        : bracket.type === 'LOSERS'
                          ? 'Losers Bracket'
                          : 'Grand Final'}{' '}
                    - Round {bracket.round}
                  </h3>
                  <Badge variant='secondary'>{bracket.matches?.length || 0} matches</Badge>
                </div>

                {bracket.matches && bracket.matches.length > 0 ? (
                  <div className='space-y-3'>
                    {bracket.matches.map((match) => (
                      <Card key={match.id} className='overflow-hidden'>
                        <CardContent className='p-4'>
                          <div className='flex items-center justify-between gap-4'>
                            <div className='flex items-center gap-4 flex-1'>
                              <div className='flex-1'>
                                <div className='flex items-center gap-2'>
                                  <p className='font-medium'>{match.homeTeam?.name || 'TBD'}</p>
                                  {match.homeTeam?.id === match.winner?.id && (
                                    <Trophy className='h-4 w-4 text-yellow-500' />
                                  )}
                                </div>
                                {match.homeTeam?.tag && (
                                  <p className='text-sm text-muted-foreground'>[{match.homeTeam.tag}]</p>
                                )}
                              </div>

                              <div className='text-center min-w-[80px]'>
                                {match.status === 'COMPLETED' ? (
                                  <div className='text-xl font-bold'>
                                    {match.homeScore ?? 0} - {match.awayScore ?? 0}
                                  </div>
                                ) : (
                                  <div className='text-lg font-bold text-muted-foreground'>VS</div>
                                )}
                              </div>

                              <div className='flex-1 text-right'>
                                <div className='flex items-center justify-end gap-2'>
                                  {match.winner?.id === match.awayTeamId && (
                                    <Trophy className='h-4 w-4 text-yellow-500' />
                                  )}
                                  <p className='font-medium'>{match.awayTeam?.name || 'TBD'}</p>
                                </div>
                                {match.awayTeam?.tag && (
                                  <p className='text-sm text-muted-foreground'>[{match.awayTeam.tag}]</p>
                                )}
                              </div>
                            </div>

                            <div className='flex items-center gap-3'>
                              <div className='text-sm text-muted-foreground text-right min-w-[120px]'>
                                {match.scheduledAt && (
                                  <>
                                    <div className='flex items-center justify-end gap-1'>
                                      <Calendar className='h-3 w-3' />
                                      {new Date(match.scheduledAt).toLocaleDateString()}
                                    </div>
                                    <div className='flex items-center justify-end gap-1'>
                                      <Clock className='h-3 w-3' />
                                      {new Date(match.scheduledAt).toLocaleTimeString([], {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                      })}
                                    </div>
                                  </>
                                )}
                              </div>

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
                                className='min-w-[100px] justify-center'
                              >
                                {match.status}
                              </Badge>

                              {(match.status === 'SCHEDULED' || match.status === 'IN_PROGRESS') && (
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant='ghost' size='sm'>
                                      <MoreVertical className='h-4 w-4' />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align='end'>
                                    {match.status === 'SCHEDULED' && (
                                      <>
                                        {!match.scheduledAt && (
                                          <DropdownMenuItem onClick={() => openScheduleDialog(match)}>
                                            <Calendar className='h-4 w-4 mr-2' />
                                            Schedule match
                                          </DropdownMenuItem>
                                        )}
                                        {match.scheduledAt && (
                                          <DropdownMenuItem onClick={() => openScheduleDialog(match)}>
                                            <Clock className='h-4 w-4 mr-2' />
                                            Edit schedule
                                          </DropdownMenuItem>
                                        )}
                                        {match.scheduledAt && (
                                          <DropdownMenuItem
                                            onClick={() => clearMatchScheduleFromRow(match.id)}
                                          >
                                            <XCircle className='h-4 w-4 mr-2' />
                                            Clear schedule
                                          </DropdownMenuItem>
                                        )}

                                        {match.homeTeamId && match.awayTeamId && (
                                          <DropdownMenuItem onClick={() => startMatch(match.id)}>
                                            <Play className='h-4 w-4 mr-2' />
                                            Start match
                                          </DropdownMenuItem>
                                        )}

                                        <DropdownMenuItem onClick={() => cancelMatch(match.id)}>
                                          <XCircle className='h-4 w-4 mr-2' />
                                          Cancel match
                                        </DropdownMenuItem>
                                      </>
                                    )}

                                    {match.status === 'IN_PROGRESS' &&
                                      match.homeTeamId &&
                                      match.awayTeamId && (
                                        <DropdownMenuItem onClick={() => openReportDialog(match)}>
                                          <Trophy className='h-4 w-4 mr-2' />
                                          Report Result
                                        </DropdownMenuItem>
                                      )}

                                    {match.status === 'IN_PROGRESS' && (
                                      <DropdownMenuItem onClick={() => cancelMatch(match.id)}>
                                        <XCircle className='h-4 w-4 mr-2' />
                                        Cancel match
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
                  <p className='text-sm text-muted-foreground'>No matches in this bracket yet</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className='text-center py-12'>
            <Calendar className='h-16 w-16 mx-auto mb-4 text-muted-foreground' />
            <p className='text-lg font-medium mb-2'>No Matches Yet</p>
            <p className='text-sm text-muted-foreground'>
              Generate the bracket first to create matches
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
