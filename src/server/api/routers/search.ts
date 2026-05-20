import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc'
import { buildTeamListWhere } from '@/lib/team-list-query'

export const searchRouter = createTRPCRouter({
  /** Dashboard navbar: tournaments + teams in one query. */
  global: protectedProcedure
    .input(
      z.object({
        q: z.string().trim().min(2).max(100),
        limit: z.number().int().min(1).max(10).default(5),
      }),
    )
    .query(async ({ ctx, input }) => {
      const search = input.q
      const limit = input.limit

      const [tournaments, teams] = await Promise.all([
        ctx.db.tournament.findMany({
          where: {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { description: { contains: search, mode: 'insensitive' } },
            ],
          },
          take: limit,
          orderBy: { startDate: 'desc' },
          select: {
            id: true,
            name: true,
            status: true,
            game: { select: { name: true } },
          },
        }),
        ctx.db.team.findMany({
          where: buildTeamListWhere({ search }),
          take: limit,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            name: true,
            tag: true,
            game: { select: { name: true } },
          },
        }),
      ])

      return { tournaments, teams }
    }),
})
