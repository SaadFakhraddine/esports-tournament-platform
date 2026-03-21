'use client'

import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Users,
  Trophy,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  Play,
  AlertTriangle,
} from 'lucide-react'
import type { inferRouterOutputs } from '@trpc/server'
import type { AppRouter } from '@/server/api/root'
import { StatCard } from './stat-card'
import { ActivityItem } from './activity-item'

type ManageOverview = inferRouterOutputs<AppRouter>['tournament']['getManageOverviewById']

type MutationLike = {
  mutateAsync: (input: { tournamentId: string }) => Promise<unknown>
  isPending: boolean
}

export function TournamentManageOverviewTab({
  tournament,
  tournamentId,
  pendingCount,
  approvedCount,
  hasBracket,
  totalMatches,
  canStart,
  startTournamentMutation,
  generateBracketMutation,
  autoSeedMutation,
  invalidateBracketAndOverview,
  invalidateRegistrations,
}: {
  tournament: ManageOverview
  tournamentId: string
  pendingCount: number
  approvedCount: number
  hasBracket: boolean
  totalMatches: number
  canStart: boolean
  startTournamentMutation: MutationLike
  generateBracketMutation: MutationLike
  autoSeedMutation: MutationLike
  invalidateBracketAndOverview: () => Promise<void>
  invalidateRegistrations: () => Promise<void>
}) {
  const runStart = async () => {
    if (tournament.status === 'REGISTRATION') {
      if (
        !confirm(
          'Warning: Registration is still open. Starting the tournament will prevent new team registrations.\n\nDo you want to proceed?',
        )
      ) {
        return
      }
    }
    try {
      await startTournamentMutation.mutateAsync({ tournamentId })
      await invalidateBracketAndOverview()
    } catch (error: unknown) {
      alert(`Cannot start tournament: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  return (
    <div className='space-y-4'>
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
        <StatCard
          title='Total Teams'
          value={`${approvedCount}/${tournament.maxTeams}`}
          icon={<Users className='h-4 w-4 text-muted-foreground' />}
        />
        <StatCard
          title='Pending Approvals'
          value={pendingCount.toString()}
          icon={<Clock className='h-4 w-4 text-muted-foreground' />}
        />
        <StatCard
          title='Matches'
          value={totalMatches.toString()}
          icon={<Trophy className='h-4 w-4 text-muted-foreground' />}
        />
        <StatCard
          title='Days Until Start'
          value={Math.max(
            0,
            Math.ceil(
              (new Date(tournament.startDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
            ),
          ).toString()}
          icon={<Calendar className='h-4 w-4 text-muted-foreground' />}
        />
      </div>

      {canStart && tournament.status !== 'IN_PROGRESS' && (
        <Card className='border-green-500/50 bg-green-500/5'>
          <CardHeader>
            <div className='flex items-center justify-between'>
              <div>
                <CardTitle className='flex items-center gap-2 text-green-600'>
                  <CheckCircle2 className='h-5 w-5' />
                  Ready to Start Tournament
                </CardTitle>
                <CardDescription>
                  All requirements met. You can start the tournament now.
                </CardDescription>
              </div>
              <Button
                size='lg'
                className='gradient-purple gap-2'
                onClick={runStart}
                disabled={startTournamentMutation.isPending}
              >
                <Play className='h-5 w-5' />
                {startTournamentMutation.isPending ? 'Starting...' : 'Start Tournament'}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className='flex items-center gap-6 text-sm'>
              <div className='flex items-center gap-2 text-green-600'>
                <CheckCircle2 className='h-4 w-4' />
                <span>{approvedCount} teams approved</span>
              </div>
              <div className='flex items-center gap-2 text-green-600'>
                <CheckCircle2 className='h-4 w-4' />
                <span>Bracket generated ({totalMatches} matches)</span>
              </div>
              {tournament.status === 'REGISTRATION' && (
                <div className='flex items-center gap-2 text-yellow-600'>
                  <AlertTriangle className='h-4 w-4' />
                  <span>Registration still open</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {!canStart &&
        tournament.status !== 'IN_PROGRESS' &&
        tournament.status !== 'COMPLETED' &&
        tournament.status !== 'CANCELLED' && (
          <Card className='border-yellow-500/50 bg-yellow-500/5'>
            <CardHeader>
              <CardTitle className='flex items-center gap-2 text-yellow-600'>
                <AlertTriangle className='h-5 w-5' />
                Tournament Not Ready
              </CardTitle>
              <CardDescription>
                Complete the following steps before starting the tournament:
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className='space-y-2 text-sm'>
                {approvedCount < 2 && (
                  <div className='flex items-center gap-2 text-muted-foreground'>
                    <XCircle className='h-4 w-4 text-red-500' />
                    <span>Need at least 2 approved teams (currently {approvedCount})</span>
                  </div>
                )}
                {(!hasBracket || totalMatches === 0) && (
                  <div className='flex items-center gap-2 text-muted-foreground'>
                    <XCircle className='h-4 w-4 text-red-500' />
                    <span>Generate tournament bracket below</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

      {tournament.status === 'IN_PROGRESS' && (
        <Card className='border-blue-500/50 bg-blue-500/5'>
          <CardHeader>
            <CardTitle className='flex items-center gap-2 text-blue-600'>
              <Play className='h-5 w-5' />
              Tournament In Progress
            </CardTitle>
            <CardDescription>
              Matches are currently being played. Manage match results in the Matches tab.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tournament management tasks</CardDescription>
        </CardHeader>
        <CardContent className='grid gap-3 md:grid-cols-2'>
          <Link href={`/dashboard/tournaments/${tournamentId}/registrations`}>
            <Button variant='outline' className='justify-start w-full'>
              <CheckCircle2 className='h-4 w-4 mr-2' />
              Approve Pending Registrations
              {pendingCount > 0 && (
                <Badge className='ml-auto' variant='destructive'>
                  {pendingCount}
                </Badge>
              )}
            </Button>
          </Link>
          <Button
            variant='outline'
            className='justify-start w-full'
            onClick={async () => {
              try {
                await generateBracketMutation.mutateAsync({ tournamentId })
                await invalidateBracketAndOverview()
              } catch (error: unknown) {
                alert(error instanceof Error ? error.message : 'An error occurred')
              }
            }}
            disabled={generateBracketMutation.isPending || approvedCount < 2}
          >
            <Trophy className='h-4 w-4 mr-2' />
            {generateBracketMutation.isPending ? 'Generating...' : 'Generate Bracket'}
          </Button>
          <Button
            variant='outline'
            className='justify-start w-full'
            onClick={async () => {
              try {
                await autoSeedMutation.mutateAsync({ tournamentId })
                await invalidateBracketAndOverview()
                await invalidateRegistrations()
              } catch (error: unknown) {
                alert(error instanceof Error ? error.message : 'An error occurred')
              }
            }}
            disabled={autoSeedMutation.isPending || approvedCount < 2}
          >
            <Users className='h-4 w-4 mr-2' />
            {autoSeedMutation.isPending ? 'Seeding...' : 'Seed Teams'}
          </Button>
          <Button
            variant='outline'
            className='justify-start w-full'
            onClick={runStart}
            disabled={startTournamentMutation.isPending || !canStart}
          >
            <Play className='h-4 w-4 mr-2' />
            {startTournamentMutation.isPending ? 'Starting...' : 'Start Tournament'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest updates for this tournament</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='space-y-4'>
            <ActivityItem action='Team registered' team='Phoenix Legends' time='2 hours ago' />
            <ActivityItem action='Registration approved' team='Dragon Squad' time='5 hours ago' />
            <ActivityItem action='Tournament updated' team='Settings changed' time='1 day ago' />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
