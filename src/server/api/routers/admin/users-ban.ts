import { z } from 'zod'
import { adminProcedure } from '@/server/api/trpc'
import { assertCanBanUser } from '@/lib/admin/guards'

export const adminUsersBan = {
  banUser: adminProcedure
    .input(
      z.object({
        userId: z.string().cuid(),
        reason: z.string().max(500).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await assertCanBanUser(ctx.db, ctx.session.user.id, input.userId)

      return ctx.db.user.update({
        where: { id: input.userId },
        data: {
          bannedAt: new Date(),
          banReason: input.reason?.trim() || null,
          bannedById: ctx.session.user.id,
        },
        select: {
          id: true,
          email: true,
          bannedAt: true,
          banReason: true,
        },
      })
    }),

  unbanUser: adminProcedure
    .input(z.object({ userId: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.user.update({
        where: { id: input.userId },
        data: {
          bannedAt: null,
          banReason: null,
          bannedById: null,
        },
        select: { id: true, email: true, bannedAt: true },
      })
    }),
}
