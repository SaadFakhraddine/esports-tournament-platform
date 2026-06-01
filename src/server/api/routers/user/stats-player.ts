import { MatchStatus, TournamentStatus } from '@prisma/client'
import { z } from 'zod'
import {
  buildCurrentStreak,
  buildForm,
  buildMatchesOverTime,
  buildWinRateOverTime,
  computeSummaryFromMatches,
  filterMatchesByGame,
  filterMatchesByRange,
  filterMatchesByTeam,
  findBestHighlight,
  type PlayerMatchRecord,
  yourTeamIdForMatch,
} from '@/lib/player-stats/aggregate'
import { protectedProcedure } from '@/server/api/trpc'

const playerStatsInputSchema = z
  .object({
    range: z.enum(['3m', '6m', '12m', 'all']).optional(),
    gameId: z.string().optional(),
    teamId: z.string().optional(),
  })
  .optional()

const emptyResponse = {
  summary: {
    teamsCount: 0,
    activeTournamentsCount: 0,
    upcomingMatchesCount: 0,
    completedMatches: 0,
    wins: 0,
    losses: 0,
    winRate: 0,
    tournamentsCompleted: 0,
    bestGame: null as { id: string; name: string; winRate: number; played: number } | null,
    bestTeam: null as { id: string; name: string; winRate: number; played: number } | null,
  },
  currentStreak: null as { type: 'win' | 'loss'; count: number } | null,
  form: [] as Array<{ result: 'win' | 'loss' | 'unknown'; completedAt: Date | null; gameName: string }>,
  matchesOverTime: [] as Array<{ period: string; wins: number; losses: number; played: number }>,
  winRateOverTime: [] as Array<{ period: string; winRate: number }>,
  byTeam: [] as Array<{
    teamId: string
    name: string
    logo: string | null
    played: number
    wins: number
    losses: number
    winRate: number
  }>,
  byGame: [] as Array<{
    gameId: string
    name: string
    slug: string
    icon: string | null
    played: number
    wins: number
    losses: number
    winRate: number
  }>,
  recentMatches: [] as Array<{
    id: string
    tournamentId: string
    tournamentName: string
    gameName: string
    gameSlug: string
    gameIcon: string | null
    completedAt: Date | null
    homeTeam: { id: string; name: string }
    awayTeam: { id: string; name: string }
    homeScore: number | null
    awayScore: number | null
    winnerTeamId: string | null
    yourTeamId: string
    yourTeamName: string
    result: 'win' | 'loss' | 'unknown'
  }>,
}

export const userStatsPlayer = {
  /**
   * Full player-facing stats: aggregates, time series, per-team/game breakdown, recent matches.
   */
  getPlayerStats: protectedProcedure.input(playerStatsInputSchema).query(async ({ ctx, input }) => {
    const userId = ctx.session.user.id
    const range = input?.range ?? 'all'
    const gameId = input?.gameId
    const teamId = input?.teamId

    const memberships = await ctx.db.teamMember.findMany({
      where: { userId },
      select: { teamId: true },
    })
    const teamIds = memberships.map((m) => m.teamId)

    if (teamIds.length === 0) {
      return emptyResponse
    }

    const teamIdSet = new Set(teamIds)

    const participatedMatchWhere = {
      status: MatchStatus.COMPLETED,
      OR: [{ homeTeamId: { in: teamIds } }, { awayTeamId: { in: teamIds } }],
    }

    const completedMatchSelect = {
      id: true,
      homeScore: true,
      awayScore: true,
      winnerTeamId: true,
      homeTeamId: true,
      awayTeamId: true,
      completedAt: true,
      tournament: {
        select: {
          id: true,
          name: true,
          game: { select: { id: true, name: true, slug: true, icon: true } },
        },
      },
      homeTeam: { select: { id: true, name: true } },
      awayTeam: { select: { id: true, name: true } },
    } as const

    const [
      activeTournamentsCount,
      upcomingMatchesCount,
      tournamentsCompleted,
      teamsMeta,
      allCompletedRaw,
    ] = await Promise.all([
      ctx.db.tournamentRegistration.count({
        where: {
          teamId: { in: teamIds },
          status: 'APPROVED',
          tournament: {
            status: {
              in: [
                TournamentStatus.REGISTRATION,
                TournamentStatus.SEEDING,
                TournamentStatus.IN_PROGRESS,
              ],
            },
          },
        },
      }),
      ctx.db.match.count({
        where: {
          OR: [{ homeTeamId: { in: teamIds } }, { awayTeamId: { in: teamIds } }],
          status: MatchStatus.SCHEDULED,
        },
      }),
      ctx.db.tournamentRegistration.findMany({
        where: {
          teamId: { in: teamIds },
          status: 'APPROVED',
          tournament: { status: TournamentStatus.COMPLETED },
        },
        select: { tournamentId: true },
        distinct: ['tournamentId'],
      }),
      ctx.db.team.findMany({
        where: { id: { in: teamIds } },
        select: { id: true, name: true, logo: true },
      }),
      ctx.db.match.findMany({
        where: participatedMatchWhere,
        select: completedMatchSelect,
      }),
    ])

    const allRecords: PlayerMatchRecord[] = allCompletedRaw.map((m) => ({
      id: m.id,
      completedAt: m.completedAt,
      homeTeamId: m.homeTeamId,
      awayTeamId: m.awayTeamId,
      winnerTeamId: m.winnerTeamId,
      gameId: m.tournament.game.id,
      gameName: m.tournament.game.name,
    }))

    let filteredRecords = filterMatchesByRange(allRecords, range)
    filteredRecords = filterMatchesByGame(filteredRecords, gameId)
    filteredRecords = filterMatchesByTeam(filteredRecords, teamId, teamIdSet)

    const filteredIds = new Set(filteredRecords.map((r) => r.id))
    const filteredMatches = allCompletedRaw.filter((m) => filteredIds.has(m.id))

    const teamsCount = teamIds.length
    const { completedMatches, wins, losses, winRate } = computeSummaryFromMatches(
      filteredRecords,
      teamIdSet,
    )

    const teamNameById = new Map(teamsMeta.map((t) => [t.id, t.name]))

    type GameAgg = {
      gameId: string
      name: string
      slug: string
      icon: string | null
      played: number
      wins: number
    }
    const gameMap = new Map<string, GameAgg>()
    const perTeamPlayedWins = new Map<string, { played: number; wins: number }>()
    for (const id of teamIds) {
      perTeamPlayedWins.set(id, { played: 0, wins: 0 })
    }

    for (const m of filteredMatches) {
      const g = m.tournament.game
      if (!gameMap.has(g.id)) {
        gameMap.set(g.id, {
          gameId: g.id,
          name: g.name,
          slug: g.slug,
          icon: g.icon,
          played: 0,
          wins: 0,
        })
      }
      const gameRow = gameMap.get(g.id)!
      gameRow.played++
      const yt = yourTeamIdForMatch(m.homeTeamId, m.awayTeamId, teamIdSet)
      if (yt && m.winnerTeamId && m.winnerTeamId === yt) {
        gameRow.wins++
      }

      const inMatch: string[] = []
      if (m.homeTeamId && teamIdSet.has(m.homeTeamId)) inMatch.push(m.homeTeamId)
      if (m.awayTeamId && teamIdSet.has(m.awayTeamId)) inMatch.push(m.awayTeamId)
      for (const tid of inMatch) {
        const row = perTeamPlayedWins.get(tid)!
        row.played++
        if (m.winnerTeamId === tid) row.wins++
      }
    }

    const metaById = new Map(teamsMeta.map((t) => [t.id, t]))
    const byTeam = teamIds.map((tid) => {
      const meta = metaById.get(tid)
      const { played, wins: teamWins } = perTeamPlayedWins.get(tid) ?? { played: 0, wins: 0 }
      return {
        teamId: tid,
        name: meta?.name ?? 'Team',
        logo: meta?.logo ?? null,
        played,
        wins: teamWins,
        losses: played - teamWins,
        winRate: played > 0 ? Math.round((teamWins / played) * 100) : 0,
      }
    })
    byTeam.sort((a, b) => b.played - a.played)

    const byGame = Array.from(gameMap.values())
      .map((r) => ({
        gameId: r.gameId,
        name: r.name,
        slug: r.slug,
        icon: r.icon,
        played: r.played,
        wins: r.wins,
        losses: r.played - r.wins,
        winRate: r.played > 0 ? Math.round((r.wins / r.played) * 100) : 0,
      }))
      .sort((a, b) => b.played - a.played)

    const sortedByDate = [...filteredMatches].sort((a, b) => {
      const ta = a.completedAt?.getTime() ?? 0
      const tb = b.completedAt?.getTime() ?? 0
      return tb - ta
    })

    const recentMatches = sortedByDate.slice(0, 20).map((m) => {
      const homeId = m.homeTeamId
      const awayId = m.awayTeamId
      let yourTeamId: string
      if (homeId && teamIdSet.has(homeId)) {
        yourTeamId = homeId
      } else if (awayId && teamIdSet.has(awayId)) {
        yourTeamId = awayId
      } else {
        yourTeamId = teamIds[0]
      }
      const yourTeamName = teamNameById.get(yourTeamId) ?? 'Your team'
      let result: 'win' | 'loss' | 'unknown' = 'unknown'
      if (m.winnerTeamId) {
        result = m.winnerTeamId === yourTeamId ? 'win' : 'loss'
      }
      const game = m.tournament.game
      return {
        id: m.id,
        tournamentId: m.tournament.id,
        tournamentName: m.tournament.name,
        gameName: game.name,
        gameSlug: game.slug,
        gameIcon: game.icon,
        completedAt: m.completedAt,
        homeTeam: m.homeTeam ?? { id: '', name: 'TBD' },
        awayTeam: m.awayTeam ?? { id: '', name: 'TBD' },
        homeScore: m.homeScore,
        awayScore: m.awayScore,
        winnerTeamId: m.winnerTeamId,
        yourTeamId,
        yourTeamName,
        result,
      }
    })

    const bestGame = findBestHighlight(
      byGame.map((g) => ({ id: g.gameId, name: g.name, played: g.played, wins: g.wins })),
    )
    const bestTeam = findBestHighlight(
      byTeam.map((t) => ({ id: t.teamId, name: t.name, played: t.played, wins: t.wins })),
    )

    return {
      summary: {
        teamsCount,
        activeTournamentsCount,
        upcomingMatchesCount,
        completedMatches,
        wins,
        losses,
        winRate,
        tournamentsCompleted: tournamentsCompleted.length,
        bestGame,
        bestTeam,
      },
      currentStreak: buildCurrentStreak(filteredRecords, teamIdSet),
      form: buildForm(filteredRecords, teamIdSet),
      matchesOverTime: buildMatchesOverTime(filteredRecords, teamIdSet),
      winRateOverTime: buildWinRateOverTime(filteredRecords, teamIdSet),
      byTeam,
      byGame,
      recentMatches,
    }
  }),
}
