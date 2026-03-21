'use client'

import { useSession } from 'next-auth/react'
import { useState } from 'react'
import { trpc } from '@/lib/trpc/client'
import { defaultMatchScheduleTime } from '@/components/dashboard/tournament-manage/tournament-schedule-utils'

export type TournamentManageTab = 'overview' | 'settings' | 'registrations' | 'bracket' | 'matches'

export function useTournamentManage(tournamentId: string) {
  const { data: session, status: sessionStatus } = useSession()

  const [activeTab, setActiveTab] = useState<TournamentManageTab>('overview')

  const sessionReady = !!session && !!tournamentId

  const { data: tournament, isLoading: tournamentLoading } = trpc.tournament.getManageOverviewById.useQuery(
    { id: tournamentId },
    { enabled: sessionReady },
  )

  const { data: bracketTree, isLoading: bracketTreeLoading } = trpc.tournament.getBracketTree.useQuery(
    { tournamentId },
    {
      enabled:
        sessionReady && (activeTab === 'bracket' || activeTab === 'matches'),
    },
  )

  const { data: registrations, isLoading: registrationsLoading } =
    trpc.tournament.getRegistrations.useQuery(
      { tournamentId },
      { enabled: sessionReady },
    )

  const approveRegistrationMutation = trpc.tournament.approveRegistration.useMutation()
  const rejectRegistrationMutation = trpc.tournament.rejectRegistration.useMutation()
  const generateBracketMutation = trpc.tournament.generateBracket.useMutation()
  const regenerateBracketMutation = trpc.tournament.regenerateBracket.useMutation()
  const autoSeedMutation = trpc.tournament.autoSeedTeams.useMutation()
  const startTournamentMutation = trpc.tournament.startTournament.useMutation()
  const submitResultMutation = trpc.match.submitResult.useMutation()

  const utils = trpc.useUtils()

  const [reportOpen, setReportOpen] = useState(false)
  const [reportMatchId, setReportMatchId] = useState<string | null>(null)
  const [reportHomeScore, setReportHomeScore] = useState('0')
  const [reportAwayScore, setReportAwayScore] = useState('0')

  const [scheduleOpen, setScheduleOpen] = useState(false)
  const [scheduleMatchId, setScheduleMatchId] = useState<string | null>(null)
  const [scheduleAt, setScheduleAt] = useState<Date | null>(null)
  const [scheduleHadTime, setScheduleHadTime] = useState(false)

  const setScheduleMutation = trpc.match.setSchedule.useMutation({
    onSuccess: async () => {
      await utils.tournament.getBracketTree.invalidate({ tournamentId })
      setScheduleOpen(false)
      setScheduleMatchId(null)
      setScheduleAt(null)
      setScheduleHadTime(false)
    },
  })

  const updateMatchStatusMutation = trpc.match.updateStatus.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.tournament.getBracketTree.invalidate({ tournamentId }),
        utils.tournament.getManageOverviewById.invalidate({ id: tournamentId }),
      ])
      setScheduleOpen(false)
      setScheduleMatchId(null)
      setScheduleAt(null)
      setScheduleHadTime(false)
    },
  })

  const invalidateBracketAndOverview = async () => {
    await Promise.all([
      utils.tournament.getManageOverviewById.invalidate({ id: tournamentId }),
      utils.tournament.getBracketTree.invalidate({ tournamentId }),
    ])
  }

  const submitReportedResult = async () => {
    if (!reportMatchId) return

    const home = Number(reportHomeScore)
    const away = Number(reportAwayScore)

    if (!Number.isFinite(home) || !Number.isFinite(away) || home < 0 || away < 0) {
      alert('Scores must be numbers >= 0')
      return
    }

    try {
      await submitResultMutation.mutateAsync({
        matchId: reportMatchId,
        homeScore: Math.trunc(home),
        awayScore: Math.trunc(away),
      })
      await invalidateBracketAndOverview()
      setReportOpen(false)
    } catch (error: unknown) {
      alert(error instanceof Error ? error.message : 'Failed to submit result')
    }
  }

  const openScheduleDialog = (match: {
    id: string
    scheduledAt: Date | string | null | undefined
  }) => {
    if (!tournament) return
    const start = new Date(tournament.startDate)
    const now = new Date()
    const base = now.getTime() < start.getTime() ? start : now
    setScheduleMatchId(match.id)
    setScheduleHadTime(!!match.scheduledAt)
    setScheduleAt(
      match.scheduledAt ? new Date(match.scheduledAt) : defaultMatchScheduleTime(base),
    )
    setScheduleOpen(true)
  }

  const saveMatchSchedule = async () => {
    if (!scheduleMatchId) return
    if (!scheduleAt) {
      alert('Choose a date and time for the match.')
      return
    }
    try {
      await setScheduleMutation.mutateAsync({
        matchId: scheduleMatchId,
        scheduledAt: scheduleAt,
      })
    } catch (error: unknown) {
      alert(error instanceof Error ? error.message : 'Failed to save schedule')
    }
  }

  const clearMatchScheduleFromRow = async (matchId: string) => {
    if (!confirm('Remove the scheduled time for this match?')) return
    try {
      await setScheduleMutation.mutateAsync({
        matchId,
        scheduledAt: null,
      })
    } catch (error: unknown) {
      alert(error instanceof Error ? error.message : 'Failed to clear schedule')
    }
  }

  const startMatch = async (matchId: string) => {
    if (!confirm('Start this match now?')) return
    try {
      await updateMatchStatusMutation.mutateAsync({
        matchId,
        status: 'IN_PROGRESS',
      })
    } catch (error: unknown) {
      alert(error instanceof Error ? error.message : 'Failed to start match')
    }
  }

  const cancelMatch = async (matchId: string) => {
    if (!confirm('Cancel this match?')) return
    try {
      await updateMatchStatusMutation.mutateAsync({
        matchId,
        status: 'CANCELLED',
      })
    } catch (error: unknown) {
      alert(error instanceof Error ? error.message : 'Failed to cancel match')
    }
  }

  const pendingCount = registrations?.filter((r) => r.status === 'PENDING').length || 0
  const approvedCount = registrations?.filter((r) => r.status === 'APPROVED').length || 0
  const hasBracket = (tournament?.bracketsCount ?? 0) > 0
  const totalMatches = tournament?.matchesCount ?? 0
  const canStart =
    !!tournament &&
    approvedCount >= 2 &&
    hasBracket &&
    totalMatches > 0 &&
    tournament.status !== 'IN_PROGRESS' &&
    tournament.status !== 'COMPLETED' &&
    tournament.status !== 'CANCELLED'

  return {
    session,
    sessionStatus,
    tournamentId,
    activeTab,
    setActiveTab,
    tournament,
    tournamentLoading,
    bracketTree,
    bracketTreeLoading,
    registrations,
    registrationsLoading,
    pendingCount,
    approvedCount,
    hasBracket,
    totalMatches,
    canStart,
    approveRegistrationMutation,
    rejectRegistrationMutation,
    generateBracketMutation,
    regenerateBracketMutation,
    autoSeedMutation,
    startTournamentMutation,
    submitResultMutation,
    setScheduleMutation,
    updateMatchStatusMutation,
    utils,
    invalidateBracketAndOverview,
    reportOpen,
    setReportOpen,
    reportMatchId,
    setReportMatchId,
    reportHomeScore,
    setReportHomeScore,
    reportAwayScore,
    setReportAwayScore,
    submitReportedResult,
    scheduleOpen,
    setScheduleOpen,
    onScheduleDialogOpenChange: (open: boolean) => {
      setScheduleOpen(open)
      if (!open) {
        setScheduleMatchId(null)
        setScheduleAt(null)
        setScheduleHadTime(false)
      }
    },
    scheduleMatchId,
    scheduleAt,
    setScheduleAt,
    scheduleHadTime,
    setScheduleHadTime,
    openScheduleDialog,
    saveMatchSchedule,
    clearMatchScheduleFromRow,
    startMatch,
    cancelMatch,
  }
}
