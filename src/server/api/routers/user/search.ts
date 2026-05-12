import { z } from 'zod'
import { protectedProcedure } from '@/server/api/trpc'

export const userSearch = {
  search: protectedProcedure
    .input(
      z.object({
        query: z.string().min(2),
        limit: z.number().int().min(1).max(50).default(10),
      }),
    )
    .query(async ({ ctx, input }) => {
      const users = await ctx.db.user.findMany({
        where: {
          OR: [
            { username: { contains: input.query, mode: 'insensitive' } },
            { email: { contains: input.query, mode: 'insensitive' } },
            { name: { contains: input.query, mode: 'insensitive' } },
          ],
        },
        take: input.limit,
        select: {
          id: true,
          email: true,
          name: true,
          username: true,
          avatar: true,
          role: true,
        },
      })

      return users
    }),
}
