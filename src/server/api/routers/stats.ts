import { createTRPCRouter, publicProcedure } from '@/server/api/trpc'
import { TournamentStatus, MatchStatus } from '@prisma/client'

export const statsRouter = createTRPCRouter({
  getPlatformStats: publicProcedure.query(async ({ ctx }) => {
    const [totalTournaments, totalTeams, completedTournaments] = await Promise.all([
      ctx.db.tournament.count(),
      ctx.db.team.count(),
      ctx.db.tournament.count({
        where: { status: TournamentStatus.COMPLETED },
      }),
    ])

    // Calculate total prize pool (sum of all numeric prize values)
    const tournaments = await ctx.db.tournament.findMany({
      where: { prizePool: { not: null } },
      select: { prizePool: true },
    })

    // Simple approximation - count tournaments with prize pools
    const tournamentsWithPrizes = tournaments.filter((t) => t.prizePool).length

    return {
      totalTournaments,
      totalTeams,
      completedTournaments,
      tournamentsWithPrizes,
    }
  }),

  getLeaderboards: publicProcedure.query(async ({ ctx }) => {
    // Top 5 Teams by Win Rate
    const teams = await ctx.db.team.findMany({
      select: {
        id: true,
        name: true,
        tag: true,
        logo: true,
        homeMatches: {
          where: { status: MatchStatus.COMPLETED },
          select: { id: true, winnerTeamId: true },
        },
        awayMatches: {
          where: { status: MatchStatus.COMPLETED },
          select: { id: true, winnerTeamId: true },
        },
      },
    })

    const teamsWithStats = teams
      .map((team) => {
        const allMatches = [...team.homeMatches, ...team.awayMatches]
        const wins = allMatches.filter((m) => m.winnerTeamId === team.id).length
        const losses = allMatches.length - wins
        const winRate = allMatches.length > 0 ? (wins / allMatches.length) * 100 : 0

        return {
          id: team.id,
          name: team.name,
          tag: team.tag,
          logo: team.logo,
          wins,
          losses,
          winRate: Math.round(winRate),
          totalMatches: allMatches.length,
        }
      })
      .filter((team) => team.totalMatches > 0) // Only teams with matches
      .sort((a, b) => b.winRate - a.winRate || b.wins - a.wins)
      .slice(0, 5)

    // Top 5 Players by Tournament Wins (team owners who won tournaments)
    const tournamentWins = await ctx.db.tournament.findMany({
      where: { status: TournamentStatus.COMPLETED },
      select: {
        id: true,
        name: true,
        brackets: {
          select: {
            matches: {
              where: { status: MatchStatus.COMPLETED },
              select: { winnerTeamId: true },
            },
          },
        },
      },
    })

    // Get teams that won tournaments (teams that won the final match)
    const winnerTeamIds = new Set<string>()
    tournamentWins.forEach((tournament) => {
      tournament.brackets.forEach((bracket) => {
        // Find the last/final match
        const finalMatch = bracket.matches[bracket.matches.length - 1]
        if (finalMatch?.winnerTeamId) {
          winnerTeamIds.add(finalMatch.winnerTeamId)
        }
      })
    })

    const winnerTeams = await ctx.db.team.findMany({
      where: { id: { in: Array.from(winnerTeamIds) } },
      select: {
        id: true,
        name: true,
        owner: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
          },
        },
      },
    })

    // Count wins per player (team owner)
    const playerWins = new Map<string, { player: { id: string; name: string | null; username: string | null; avatar: string | null }; winCount: number }>()
    winnerTeams.forEach((team) => {
      const playerId = team.owner.id
      if (!playerWins.has(playerId)) {
        playerWins.set(playerId, {
          player: team.owner,
          winCount: 0,
        })
      }
      const current = playerWins.get(playerId)!
      current.winCount++
    })

    const topPlayers = Array.from(playerWins.values())
      .sort((a, b) => b.winCount - a.winCount)
      .slice(0, 5)
      .map((item) => ({
        id: item.player.id,
        // Ensure the frontend always receives a displayable string
        name: item.player.name ?? item.player.username ?? 'Unknown',
        avatar: item.player.avatar,
        winCount: item.winCount,
      }))

    // Recent Champions (last 5 completed tournaments with winners)
    const recentCompletedTournaments = await ctx.db.tournament.findMany({
      where: { status: TournamentStatus.COMPLETED, endDate: { not: null } },
      orderBy: { endDate: 'desc' },
      take: 5,
      select: {
        id: true,
        name: true,
        endDate: true,
        game: { select: { name: true, icon: true } },
        brackets: {
          select: {
            matches: {
              where: {
                status: MatchStatus.COMPLETED,
                winnerTeamId: { not: null },
                homeTeamId: { not: null },
                awayTeamId: { not: null },
              },
              orderBy: { completedAt: 'desc' },
              take: 1,
              select: {
                winnerTeamId: true,
                homeTeam: { select: { id: true, name: true, logo: true } },
                awayTeam: { select: { id: true, name: true, logo: true } },
              },
            },
          },
        },
      },
    })

    const recentChampions = recentCompletedTournaments.flatMap((tournament) => {
      // Find the winner from the final match (guaranteed by winnerTeamId filter above)
      for (const bracket of tournament.brackets) {
        const finalMatch = bracket.matches[0]
        if (finalMatch?.winnerTeamId) {
          const homeTeam = finalMatch.homeTeam
          const awayTeam = finalMatch.awayTeam
          if (!homeTeam || !awayTeam) continue

          const winnerTeam =
            homeTeam.id === finalMatch.winnerTeamId ? homeTeam : awayTeam

          if (!winnerTeam) continue

          return [
            {
              tournamentId: tournament.id,
              tournamentName: tournament.name,
              gameName: tournament.game.name,
              gameIcon: tournament.game.icon,
              winnerTeam,
              completedAt: tournament.endDate!, // filtered to non-null above
            },
          ]
        }
      }

      return []
    })

    return {
      topTeams: teamsWithStats,
      topPlayers,
      recentChampions,
    }
  }),

  getRecentActivity: publicProcedure.query(async ({ ctx }) => {
    const [recentRegistrations, recentCompletions, newTournaments] = await Promise.all([
      // Recent tournament registrations
      ctx.db.tournamentRegistration.findMany({
        where: { status: 'APPROVED' },
        orderBy: { registeredAt: 'desc' },
        take: 5,
        select: {
          id: true,
          registeredAt: true,
          team: { select: { id: true, name: true } },
          tournament: { select: { id: true, name: true } },
        },
      }),

      // Recent tournament completions
      ctx.db.tournament.findMany({
        where: { status: TournamentStatus.COMPLETED },
        orderBy: { updatedAt: 'desc' },
        take: 5,
        select: {
          id: true,
          name: true,
          updatedAt: true,
          brackets: {
            select: {
              matches: {
                where: { status: MatchStatus.COMPLETED },
                orderBy: { completedAt: 'desc' },
                take: 1,
                select: {
                  winnerTeamId: true,
                  homeTeam: { select: { id: true, name: true } },
                  awayTeam: { select: { id: true, name: true } },
                },
              },
            },
          },
        },
      }),

      // New tournaments (registration open)
      ctx.db.tournament.findMany({
        where: { status: TournamentStatus.REGISTRATION },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          name: true,
          createdAt: true,
          game: { select: { name: true } },
        },
      }),
    ])

    // Combine activities
    const activities: Array<{
      id: string
      type: 'registration' | 'completion' | 'new_tournament'
      message: string
      link: string
      timestamp: Date
    }> = []

    recentRegistrations.forEach((reg) => {
      activities.push({
        id: `reg-${reg.id}`,
        type: 'registration',
        message: `${reg.team.name} registered for ${reg.tournament.name}`,
        link: `/tournaments/${reg.tournament.id}`,
        timestamp: reg.registeredAt,
      })
    })

    recentCompletions.forEach((tournament) => {
      let winnerName = 'Unknown'
      for (const bracket of tournament.brackets) {
        const finalMatch = bracket.matches[0]
        if (finalMatch?.winnerTeamId) {
          const homeTeam = finalMatch.homeTeam
          const awayTeam = finalMatch.awayTeam
          if (!homeTeam || !awayTeam) {
            break
          }

          winnerName =
            homeTeam.id === finalMatch.winnerTeamId ? homeTeam.name : awayTeam.name
          break
        }
      }

      activities.push({
        id: `comp-${tournament.id}`,
        type: 'completion',
        message: `${winnerName} won ${tournament.name}`,
        link: `/tournaments/${tournament.id}`,
        timestamp: tournament.updatedAt,
      })
    })

    newTournaments.forEach((tournament) => {
      activities.push({
        id: `new-${tournament.id}`,
        type: 'new_tournament',
        message: `${tournament.name} (${tournament.game.name}) just opened registration`,
        link: `/tournaments/${tournament.id}`,
        timestamp: tournament.createdAt,
      })
    })

    // Sort by timestamp and return top 10
    return activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, 10)
  }),

  getLiveTournaments: publicProcedure.query(async ({ ctx }) => {
    const tournaments = await ctx.db.tournament.findMany({
      where: { status: TournamentStatus.IN_PROGRESS },
      orderBy: { startDate: 'desc' },
      take: 6,
      select: {
        id: true,
        name: true,
        game: { select: { name: true, icon: true } },
        format: true,
        startDate: true,
        _count: {
          select: {
            registrations: { where: { status: 'APPROVED' } },
          },
        },
      },
    })

    // Normalize nullable game icon to avoid `| null` types on the frontend
    return tournaments.map((t) => ({
      ...t,
      game: {
        ...t.game,
        icon: t.game.icon ?? undefined,
      },
    }))
  }),

  getUpcomingTournaments: publicProcedure.query(async ({ ctx }) => {
    const tournaments = await ctx.db.tournament.findMany({
      where: { status: TournamentStatus.REGISTRATION },
      orderBy: { startDate: 'asc' },
      take: 6,
      select: {
        id: true,
        name: true,
        game: { select: { name: true, icon: true } },
        format: true,
        maxTeams: true,
        startDate: true,
        _count: {
          select: {
            registrations: { where: { status: 'APPROVED' } },
          },
        },
      },
    })

    // Normalize nullable game icon to avoid `| null` types on the frontend
    return tournaments.map((t) => ({
      ...t,
      game: {
        ...t.game,
        icon: t.game.icon ?? undefined,
      },
    }))
  }),
})
