import { createTRPCRouter, publicProcedure } from '@/server/api/trpc'
import { TournamentStatus } from '@prisma/client'

export const statsRouter = createTRPCRouter({
  getPlatformStats: publicProcedure.query(async ({ ctx }) => {
    const [totalTournaments, totalTeams, completedTournaments, tournamentsWithPrizes] = await Promise.all([
      ctx.db.tournament.count(),
      ctx.db.team.count(),
      ctx.db.tournament.count({
        where: { status: TournamentStatus.COMPLETED },
      }),
      ctx.db.tournament.count({
        where: {
          prizePool: { not: null },
          NOT: { prizePool: '' },
        },
      }),
    ])

    return {
      totalTournaments,
      totalTeams,
      completedTournaments,
      tournamentsWithPrizes,
    }
  }),

  getLeaderboards: publicProcedure.query(async ({ ctx }) => {
    const [topTeamRows, topPlayerRows, recentChampionRows] = await Promise.all([
      // Top teams by win rate — single aggregation over home/away participation (no N+1, no full table scan of matches into Node)
      ctx.db.$queryRaw<
        Array<{
          id: string
          name: string
          tag: string | null
          logo: string | null
          wins: number
          losses: number
        }>
      >`
        WITH participation AS (
          SELECT "homeTeamId" AS team_id, "winnerTeamId"
          FROM "Match"
          WHERE status = 'COMPLETED' AND "homeTeamId" IS NOT NULL
          UNION ALL
          SELECT "awayTeamId", "winnerTeamId"
          FROM "Match"
          WHERE status = 'COMPLETED' AND "awayTeamId" IS NOT NULL
        )
        SELECT
          t.id,
          t.name,
          t.tag,
          t.logo,
          SUM(CASE WHEN p."winnerTeamId" = p.team_id THEN 1 ELSE 0 END)::int AS wins,
          (COUNT(*)::int - SUM(CASE WHEN p."winnerTeamId" = p.team_id THEN 1 ELSE 0 END)::int) AS losses
        FROM participation p
        INNER JOIN "Team" t ON t.id = p.team_id
        GROUP BY t.id, t.name, t.tag, t.logo
        HAVING COUNT(*) > 0
        ORDER BY
          (SUM(CASE WHEN p."winnerTeamId" = p.team_id THEN 1.0) / COUNT(*)::float) DESC,
          SUM(CASE WHEN p."winnerTeamId" = p.team_id THEN 1 ELSE 0 END) DESC
        LIMIT 5
      `,

      // Tournament championships: owners of teams that won a terminal bracket match (nextMatchId IS NULL)
      ctx.db.$queryRaw<
        Array<{
          id: string
          name: string | null
          username: string | null
          avatar: string | null
          winCount: number
        }>
      >`
        SELECT
          u.id,
          u.name,
          u.username,
          u.avatar,
          COUNT(DISTINCT tr.id)::int AS "winCount"
        FROM "Match" m
        INNER JOIN "Team" t ON t.id = m."winnerTeamId"
        INNER JOIN "User" u ON u.id = t."ownerId"
        INNER JOIN "Tournament" tr ON tr.id = m."tournamentId"
        WHERE m.status = 'COMPLETED'
          AND tr.status = 'COMPLETED'
          AND m."nextMatchId" IS NULL
          AND m."winnerTeamId" IS NOT NULL
        GROUP BY u.id, u.name, u.username, u.avatar
        ORDER BY "winCount" DESC
        LIMIT 5
      `,

      // Last 5 completed tournaments with a resolved grand-final-style winner
      ctx.db.$queryRaw<
        Array<{
          tournamentId: string
          tournamentName: string
          completedAt: Date
          gameName: string
          gameIcon: string | null
          winnerTeam_id: string
          winnerTeam_name: string
          winnerTeam_logo: string | null
        }>
      >`
        WITH champs AS (
          SELECT DISTINCT ON (m."tournamentId")
            m."tournamentId",
            m."winnerTeamId"
          FROM "Match" m
          INNER JOIN "Tournament" tr ON tr.id = m."tournamentId"
          WHERE tr.status = 'COMPLETED'
            AND m.status = 'COMPLETED'
            AND m."winnerTeamId" IS NOT NULL
            AND m."nextMatchId" IS NULL
          ORDER BY m."tournamentId", m."completedAt" DESC NULLS LAST
        )
        SELECT
          tr.id AS "tournamentId",
          tr.name AS "tournamentName",
          tr."endDate" AS "completedAt",
          g.name AS "gameName",
          g.icon AS "gameIcon",
          wt.id AS "winnerTeam_id",
          wt.name AS "winnerTeam_name",
          wt.logo AS "winnerTeam_logo"
        FROM "Tournament" tr
        INNER JOIN champs c ON c."tournamentId" = tr.id
        INNER JOIN "Team" wt ON wt.id = c."winnerTeamId"
        INNER JOIN "Game" g ON g.id = tr."gameId"
        WHERE tr."endDate" IS NOT NULL
        ORDER BY tr."endDate" DESC
        LIMIT 5
      `,
    ])

    const topTeams = topTeamRows.map((row) => {
      const total = row.wins + row.losses
      const winRate = total > 0 ? Math.round((row.wins / total) * 100) : 0
      return {
        id: row.id,
        name: row.name,
        tag: row.tag,
        logo: row.logo,
        wins: row.wins,
        losses: row.losses,
        winRate,
        totalMatches: total,
      }
    })

    const topPlayers = topPlayerRows.map((row) => ({
      id: row.id,
      name: row.name ?? row.username ?? 'Unknown',
      avatar: row.avatar,
      winCount: row.winCount,
    }))

    const recentChampions = recentChampionRows.map((row) => ({
      tournamentId: row.tournamentId,
      tournamentName: row.tournamentName,
      gameName: row.gameName,
      gameIcon: row.gameIcon,
      winnerTeam: {
        id: row.winnerTeam_id,
        name: row.winnerTeam_name,
        logo: row.winnerTeam_logo,
      },
      completedAt: row.completedAt,
    }))

    return {
      topTeams,
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

      // Recent tournament completions (winner from terminal match; avoids loading all brackets)
      ctx.db.$queryRaw<
        Array<{
          id: string
          name: string
          updatedAt: Date
          winnerName: string | null
        }>
      >`
        WITH champs AS (
          SELECT DISTINCT ON (m."tournamentId")
            m."tournamentId",
            wt.name AS "winnerName"
          FROM "Match" m
          INNER JOIN "Tournament" tr ON tr.id = m."tournamentId"
          INNER JOIN "Team" wt ON wt.id = m."winnerTeamId"
          WHERE tr.status = 'COMPLETED'
            AND m.status = 'COMPLETED'
            AND m."winnerTeamId" IS NOT NULL
            AND m."nextMatchId" IS NULL
          ORDER BY m."tournamentId", m."completedAt" DESC NULLS LAST
        )
        SELECT tr.id, tr.name, tr."updatedAt", c."winnerName"
        FROM "Tournament" tr
        INNER JOIN champs c ON c."tournamentId" = tr.id
        WHERE tr.status = 'COMPLETED'
        ORDER BY tr."updatedAt" DESC
        LIMIT 5
      `,

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
      const winnerName = tournament.winnerName ?? 'Unknown'
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
