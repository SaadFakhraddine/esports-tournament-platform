import { MatchStatus, TournamentStatus } from '@prisma/client'
import { protectedProcedure } from '@/server/api/trpc'

export const userStatsPlayer = {
  /**
   * Full player-facing stats: aggregates, per-team breakdown, recent completed matches.
   */
  getPlayerStats: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id

    const memberships = await ctx.db.teamMember.findMany({
      where: { userId },
      select: { teamId: true },
    })
    const teamIds = memberships.map((m) => m.teamId)

    if (teamIds.length === 0) {
      return {
        summary: {
          teamsCount: 0,
          activeTournamentsCount: 0,
          upcomingMatchesCount: 0,
          completedMatches: 0,
          wins: 0,
          losses: 0,
          winRate: 0,
          tournamentsCompleted: 0,
        },
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
    }

    const teamIdSet = new Set(teamIds)

    function yourTeamIdForMatch(homeTeamId: string | null, awayTeamId: string | null): string | null {
      if (homeTeamId && teamIdSet.has(homeTeamId)) return homeTeamId
      if (awayTeamId && teamIdSet.has(awayTeamId)) return awayTeamId
      return null
    }

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
      allCompleted,
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

    const teamsCount = teamIds.length
    const completedMatches = allCompleted.length
    const wins = allCompleted.filter((m) => m.winnerTeamId != null && teamIdSet.has(m.winnerTeamId)).length
    const losses = completedMatches - wins
    const winRate = completedMatches > 0 ? Math.round((wins / completedMatches) * 100) : 0

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

    for (const m of allCompleted) {
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
      const yt = yourTeamIdForMatch(m.homeTeamId, m.awayTeamId)
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
    const byTeam = teamIds.map((teamId) => {
      const meta = metaById.get(teamId)
      const { played, wins: teamWins } = perTeamPlayedWins.get(teamId) ?? { played: 0, wins: 0 }
      return {
        teamId,
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

    const sortedByDate = [...allCompleted].sort((a, b) => {
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
      },
      byTeam,
      byGame,
      recentMatches,
    }
  }),
}
