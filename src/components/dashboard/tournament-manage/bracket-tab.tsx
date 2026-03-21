'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Trophy } from 'lucide-react'
import type { inferRouterOutputs } from '@trpc/server'
import type { AppRouter } from '@/server/api/root'

type BracketTree = inferRouterOutputs<AppRouter>['tournament']['getBracketTree']

type MutationLike = {
  mutateAsync: (input: { tournamentId: string }) => Promise<unknown>
  isPending: boolean
}

export function TournamentManageBracketTab({
  tournamentId,
  tournamentStatus,
  hasBracket,
  approvedCount,
  bracketTree,
  bracketTreeLoading,
  generateBracketMutation,
  regenerateBracketMutation,
  invalidateBracketAndOverview,
}: {
  tournamentId: string
  tournamentStatus: string
  hasBracket: boolean
  approvedCount: number
  bracketTree: BracketTree | undefined
  bracketTreeLoading: boolean
  generateBracketMutation: MutationLike
  regenerateBracketMutation: MutationLike
  invalidateBracketAndOverview: () => Promise<void>
}) {
  return (
    <Card>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <div>
            <CardTitle>Tournament Bracket</CardTitle>
            <CardDescription>View and manage the tournament bracket</CardDescription>
          </div>
          {hasBracket && tournamentStatus !== 'IN_PROGRESS' && tournamentStatus !== 'COMPLETED' && (
            <Button
              variant='outline'
              size='sm'
              onClick={async () => {
                if (
                  confirm(
                    'Are you sure you want to regenerate the bracket? This will clear the current bracket.',
                  )
                ) {
                  try {
                    await regenerateBracketMutation.mutateAsync({ tournamentId })
                    await invalidateBracketAndOverview()
                  } catch (error: unknown) {
                    alert(error instanceof Error ? error.message : 'Something went wrong')
                  }
                }
              }}
              disabled={regenerateBracketMutation.isPending}
            >
              <Trophy className='h-4 w-4 mr-2' />
              {regenerateBracketMutation.isPending ? 'Regenerating...' : 'Regenerate Bracket'}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {bracketTreeLoading ? (
          <Skeleton className='h-64 w-full' />
        ) : bracketTree?.brackets?.length ? (
          <div className='space-y-6'>
            {bracketTree?.brackets?.map((bracket) => (
              <div key={bracket.id} className='space-y-4'>
                <div className='flex items-center gap-2'>
                  <h3 className='font-semibold'>
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
                  <div className='space-y-2'>
                    {bracket.matches.map((match) => (
                      <div
                        key={match.id}
                        className='flex items-center justify-between p-3 border rounded-lg'
                      >
                        <div className='flex items-center gap-4 flex-1'>
                          <div className='flex-1'>
                            <p className='font-medium'>{match.homeTeam?.name || 'TBD'}</p>
                            {match.homeTeam?.tag && (
                              <p className='text-sm text-muted-foreground'>[{match.homeTeam.tag}]</p>
                            )}
                          </div>
                          <div className='text-lg font-bold text-muted-foreground'>VS</div>
                          <div className='flex-1 text-right'>
                            <p className='font-medium'>{match.awayTeam?.name || 'TBD'}</p>
                            {match.awayTeam?.tag && (
                              <p className='text-sm text-muted-foreground'>[{match.awayTeam.tag}]</p>
                            )}
                          </div>
                        </div>
                        <Badge variant='outline' className='ml-4'>
                          {match.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className='text-sm text-muted-foreground'>No matches in this round yet</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className='text-center py-12'>
            <Trophy className='h-16 w-16 mx-auto mb-4 text-muted-foreground' />
            <p className='text-lg font-medium mb-2'>Bracket Not Generated</p>
            <p className='text-sm text-muted-foreground mb-4'>
              {approvedCount < 2
                ? `Need at least 2 approved teams to generate bracket (currently ${approvedCount})`
                : 'Approve registrations and seed teams before generating the bracket'}
            </p>
            <Button
              onClick={async () => {
                try {
                  await generateBracketMutation.mutateAsync({ tournamentId })
                  await invalidateBracketAndOverview()
                } catch (error: unknown) {
                  alert(error instanceof Error ? error.message : 'Something went wrong')
                }
              }}
              disabled={generateBracketMutation.isPending || approvedCount < 2}
            >
              <Trophy className='h-4 w-4 mr-2' />
              {generateBracketMutation.isPending ? 'Generating...' : 'Generate Bracket'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
