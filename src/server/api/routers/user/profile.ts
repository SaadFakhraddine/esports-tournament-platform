import { z } from 'zod'
import { protectedProcedure } from '@/server/api/trpc'
import { TRPCError } from '@trpc/server'

export const userProfile = {
  getProfile: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.db.user.findUnique({
      where: { id: ctx.session.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        username: true,
        avatar: true,
        role: true,
        createdAt: true,
        ownedTeams: {
          select: {
            id: true,
            name: true,
            logo: true,
          },
        },
        teamMemberships: {
          select: {
            team: {
              select: {
                id: true,
                name: true,
                logo: true,
              },
            },
            role: true,
          },
        },
      },
    })

    return user
  }),

  updateProfile: protectedProcedure
    .input(
      z.object({
        name: z.string().min(2).optional(),
        username: z.string().min(3).max(20).optional(),
        avatar: z.string().url().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (input.username) {
        const existing = await ctx.db.user.findFirst({
          where: {
            username: input.username,
            NOT: { id: ctx.session.user.id },
          },
        })

        if (existing) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'Username already taken',
          })
        }
      }

      const user = await ctx.db.user.update({
        where: { id: ctx.session.user.id },
        data: input,
        select: {
          id: true,
          email: true,
          name: true,
          username: true,
          avatar: true,
          role: true,
        },
      })

      return user
    }),
}
