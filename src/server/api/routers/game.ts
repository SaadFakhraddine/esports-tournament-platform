import { createTRPCRouter, publicProcedure } from '@/server/api/trpc'

export const gameRouter = createTRPCRouter({
  getAll: publicProcedure.query(async ({ ctx }) => {
    const games = await ctx.db.game.findMany({
      where: {
        active: true,
      },
      orderBy: {
        name: 'asc',
      },
    })

    return games
  }),
})
