import { protectedProcedure } from '@/server/api/trpc'

export const userStatsDashboard = {
  getDashboardStats: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id

    const teamsCount = await ctx.db.teamMember.count({
      where: { userId },
    })

    const userTeamIds = await ctx.db.teamMember.findMany({
      where: { userId },
      select: { teamId: true },
    })

    const teamIds = userTeamIds.map((tm) => tm.teamId)

    const activeTournamentsCount = await ctx.db.tournamentRegistration.count({
      where: {
        teamId: { in: teamIds },
        status: 'APPROVED',
        tournament: {
          status: { in: ['REGISTRATION', 'SEEDING', 'IN_PROGRESS'] },
        },
      },
    })

    const upcomingMatchesCount = await ctx.db.match.count({
      where: {
        OR: [{ homeTeamId: { in: teamIds } }, { awayTeamId: { in: teamIds } }],
        status: 'SCHEDULED',
      },
    })

    const totalMatches = await ctx.db.match.count({
      where: {
        OR: [{ homeTeamId: { in: teamIds } }, { awayTeamId: { in: teamIds } }],
        status: 'COMPLETED',
      },
    })

    const wonMatches = await ctx.db.match.count({
      where: {
        winnerTeamId: { in: teamIds },
        status: 'COMPLETED',
      },
    })

    const winRate = totalMatches > 0 ? Math.round((wonMatches / totalMatches) * 100) : 0

    return {
      teamsCount,
      activeTournamentsCount,
      upcomingMatchesCount,
      winRate,
      totalMatches,
      wonMatches,
    }
  }),
}
