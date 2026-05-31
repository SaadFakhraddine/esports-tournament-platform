import { adminProcedure } from '@/server/api/trpc'

export const adminOverview = {
  getOverview: adminProcedure.query(async ({ ctx }) => {
    const [userCount, gameCount, activeGameCount, tournamentCount, bannedCount, recentSuspensions] =
      await Promise.all([
        ctx.db.user.count(),
        ctx.db.game.count(),
        ctx.db.game.count({ where: { active: true } }),
        ctx.db.tournament.count(),
        ctx.db.user.count({ where: { bannedAt: { not: null } } }),
        ctx.db.user.findMany({
          where: { bannedAt: { not: null } },
          orderBy: { bannedAt: 'desc' },
          take: 5,
          select: {
            id: true,
            email: true,
            bannedAt: true,
            banReason: true,
            bannedBy: { select: { email: true } },
          },
        }),
      ])

    return {
      userCount,
      gameCount,
      activeGameCount,
      tournamentCount,
      bannedCount,
      recentSuspensions,
    }
  }),
}
