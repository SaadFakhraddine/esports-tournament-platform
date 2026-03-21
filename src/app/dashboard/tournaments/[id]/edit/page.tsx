'use client'

import { useSession } from 'next-auth/react'
import { redirect, useParams } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useTournamentManage } from '@/hooks/use-tournament-manage'
import { TournamentManageOverviewTab } from '@/components/dashboard/tournament-manage/overview-tab'
import { TournamentManageSettingsTab } from '@/components/dashboard/tournament-manage/settings-tab'
import { TournamentManageRegistrationsTab } from '@/components/dashboard/tournament-manage/registrations-tab'
import { TournamentManageBracketTab } from '@/components/dashboard/tournament-manage/bracket-tab'
import { TournamentManageMatchesTab } from '@/components/dashboard/tournament-manage/matches-tab'
import { TournamentManageDialogs } from '@/components/dashboard/tournament-manage/manage-dialogs'

export default function TournamentManagePage() {
  const { data: session, status } = useSession()
  const params = useParams()
  const tournamentId = params.id as string

  const vm = useTournamentManage(tournamentId)

  if (status === 'loading' || vm.tournamentLoading) {
    return (
      <DashboardLayout userRole={session?.user?.role}>
        <div className='space-y-6'>
          <Skeleton className='h-12 w-96' />
          <Skeleton className='h-64' />
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

  if (!vm.tournament) {
    return (
      <DashboardLayout userRole={session.user.role}>
        <div className='text-center py-12'>
          <p className='text-lg font-medium'>Tournament not found</p>
        </div>
      </DashboardLayout>
    )
  }

  const tournament = vm.tournament

  return (
    <DashboardLayout userRole={session.user.role}>
      <div className='space-y-6'>
        <div>
          <div className='flex items-center gap-2 mb-2'>
            <h1 className='text-3xl font-bold tracking-tight'>{tournament.name}</h1>
            <Badge
              variant='outline'
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
          <p className='text-muted-foreground'>
            Manage tournament settings, registrations, and brackets
          </p>
        </div>

        <Tabs
          value={vm.activeTab}
          onValueChange={(value) => vm.setActiveTab(value as typeof vm.activeTab)}
          className='space-y-4'
        >
          <TabsList className='grid w-full grid-cols-5'>
            <TabsTrigger value='overview'>Overview</TabsTrigger>
            <TabsTrigger value='settings'>Settings</TabsTrigger>
            <TabsTrigger value='registrations'>Registrations</TabsTrigger>
            <TabsTrigger value='bracket'>Bracket</TabsTrigger>
            <TabsTrigger value='matches'>Matches</TabsTrigger>
          </TabsList>

          <TabsContent value='overview' className='space-y-4'>
            <TournamentManageOverviewTab
              tournament={tournament}
              tournamentId={vm.tournamentId}
              pendingCount={vm.pendingCount}
              approvedCount={vm.approvedCount}
              hasBracket={vm.hasBracket}
              totalMatches={vm.totalMatches}
              canStart={vm.canStart}
              startTournamentMutation={vm.startTournamentMutation}
              generateBracketMutation={vm.generateBracketMutation}
              autoSeedMutation={vm.autoSeedMutation}
              invalidateBracketAndOverview={vm.invalidateBracketAndOverview}
              invalidateRegistrations={() =>
                vm.utils.tournament.getRegistrations.invalidate({ tournamentId: vm.tournamentId })
              }
            />
          </TabsContent>

          <TabsContent value='settings' className='space-y-4'>
            <TournamentManageSettingsTab tournament={tournament} />
          </TabsContent>

          <TabsContent value='registrations' className='space-y-4'>
            <TournamentManageRegistrationsTab
              tournamentId={vm.tournamentId}
              gameId={tournament.game.id}
              canAddTeams={tournament.status === 'REGISTRATION'}
              registrations={vm.registrations}
              isLoading={vm.registrationsLoading}
              onApprove={async (registrationId) => {
                await vm.approveRegistrationMutation.mutateAsync({ registrationId })
                vm.utils.tournament.getRegistrations.invalidate({ tournamentId: vm.tournamentId })
              }}
              onReject={async (registrationId) => {
                await vm.rejectRegistrationMutation.mutateAsync({ registrationId })
                vm.utils.tournament.getRegistrations.invalidate({ tournamentId: vm.tournamentId })
              }}
            />
          </TabsContent>

          <TabsContent value='bracket' className='space-y-4'>
            <TournamentManageBracketTab
              tournamentId={vm.tournamentId}
              tournamentStatus={tournament.status}
              hasBracket={vm.hasBracket}
              approvedCount={vm.approvedCount}
              bracketTree={vm.bracketTree}
              bracketTreeLoading={vm.bracketTreeLoading}
              generateBracketMutation={vm.generateBracketMutation}
              regenerateBracketMutation={vm.regenerateBracketMutation}
              invalidateBracketAndOverview={vm.invalidateBracketAndOverview}
            />
          </TabsContent>

          <TabsContent value='matches' className='space-y-4'>
            <TournamentManageMatchesTab
              bracketTree={vm.bracketTree}
              bracketTreeLoading={vm.bracketTreeLoading}
              openScheduleDialog={vm.openScheduleDialog}
              clearMatchScheduleFromRow={vm.clearMatchScheduleFromRow}
              startMatch={vm.startMatch}
              cancelMatch={vm.cancelMatch}
              openReportDialog={(match) => {
                vm.setReportMatchId(match.id)
                vm.setReportHomeScore(String(match.homeScore ?? 0))
                vm.setReportAwayScore(String(match.awayScore ?? 0))
                vm.setReportOpen(true)
              }}
            />
          </TabsContent>
        </Tabs>

        <TournamentManageDialogs
          reportOpen={vm.reportOpen}
          setReportOpen={vm.setReportOpen}
          reportHomeScore={vm.reportHomeScore}
          setReportHomeScore={vm.setReportHomeScore}
          reportAwayScore={vm.reportAwayScore}
          setReportAwayScore={vm.setReportAwayScore}
          submitReportedResult={vm.submitReportedResult}
          submitResultMutation={vm.submitResultMutation}
          reportMatchId={vm.reportMatchId}
          scheduleOpen={vm.scheduleOpen}
          onScheduleDialogOpenChange={vm.onScheduleDialogOpenChange}
          scheduleHadTime={vm.scheduleHadTime}
          scheduleAt={vm.scheduleAt}
          setScheduleAt={vm.setScheduleAt}
          scheduleMatchId={vm.scheduleMatchId}
          saveMatchSchedule={vm.saveMatchSchedule}
          setScheduleMutation={vm.setScheduleMutation}
        />
      </div>
    </DashboardLayout>
  )
}
