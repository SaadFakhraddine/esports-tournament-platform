import { adminProcedure } from '@/server/api/trpc'

export const adminOverview = {
  getOverview: adminProcedure.query(async ({ ctx }) => {
    const [userCount, gameCount, activeGameCount, tournamentCount, bannedCount] =
      await Promise.all([
        ctx.db.user.count(),
        ctx.db.game.count(),
        ctx.db.game.count({ where: { active: true } }),
        ctx.db.tournament.count(),
        ctx.db.user.count({ where: { bannedAt: { not: null } } }),
      ])

    return {
      userCount,
      gameCount,
      activeGameCount,
      tournamentCount,
      bannedCount,
    }
  }),
}
