import { protectedProcedure } from '@/server/api/trpc'

type DashboardStatsRow = {
  teams_count: number
  active_tournaments_count: number
  upcoming_matches_count: number
  total_matches: number
  won_matches: number
}

export const userStatsDashboard = {
  getDashboardStats: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id

    const rows = await ctx.db.$queryRaw<DashboardStatsRow[]>`
      SELECT
        (SELECT COUNT(*)::int FROM "TeamMember" WHERE "userId" = ${userId}) AS teams_count,
        (
          SELECT COUNT(*)::int
          FROM "TournamentRegistration" tr
          INNER JOIN "Tournament" t ON tr."tournamentId" = t.id
          WHERE tr."teamId" IN (SELECT "teamId" FROM "TeamMember" WHERE "userId" = ${userId})
            AND tr.status = 'APPROVED'
            AND t.status IN ('REGISTRATION', 'SEEDING', 'IN_PROGRESS')
        ) AS active_tournaments_count,
        (
          SELECT COUNT(*)::int
          FROM "Match" m
          WHERE m.status = 'SCHEDULED'
            AND (
              m."homeTeamId" IN (SELECT "teamId" FROM "TeamMember" WHERE "userId" = ${userId})
              OR m."awayTeamId" IN (SELECT "teamId" FROM "TeamMember" WHERE "userId" = ${userId})
            )
        ) AS upcoming_matches_count,
        (
          SELECT COUNT(*)::int
          FROM "Match" m
          WHERE m.status = 'COMPLETED'
            AND (
              m."homeTeamId" IN (SELECT "teamId" FROM "TeamMember" WHERE "userId" = ${userId})
              OR m."awayTeamId" IN (SELECT "teamId" FROM "TeamMember" WHERE "userId" = ${userId})
            )
        ) AS total_matches,
        (
          SELECT COUNT(*)::int
          FROM "Match" m
          WHERE m.status = 'COMPLETED'
            AND m."winnerTeamId" IN (SELECT "teamId" FROM "TeamMember" WHERE "userId" = ${userId})
        ) AS won_matches
    `

    const row = rows[0] ?? {
      teams_count: 0,
      active_tournaments_count: 0,
      upcoming_matches_count: 0,
      total_matches: 0,
      won_matches: 0,
    }

    const totalMatches = row.total_matches
    const wonMatches = row.won_matches
    const winRate = totalMatches > 0 ? Math.round((wonMatches / totalMatches) * 100) : 0

    return {
      teamsCount: row.teams_count,
      activeTournamentsCount: row.active_tournaments_count,
      upcomingMatchesCount: row.upcoming_matches_count,
      winRate,
      totalMatches,
      wonMatches,
    }
  }),
}
