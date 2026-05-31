import { z } from 'zod'
import { adminProcedure } from '@/server/api/trpc'
import { assertCanBanUser } from '@/lib/admin/guards'
import { logAdminAction } from '@/lib/admin/audit'

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

      const updated = await ctx.db.user.update({
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

      await logAdminAction(ctx.db, {
        actorId: ctx.session.user.id,
        action: 'USER_BANNED',
        targetType: 'user',
        targetId: input.userId,
        metadata: { email: updated.email, reason: input.reason?.trim() || null },
      })

      return updated
    }),

  unbanUser: adminProcedure
    .input(z.object({ userId: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.user.findUnique({
        where: { id: input.userId },
        select: { email: true },
      })

      const updated = await ctx.db.user.update({
        where: { id: input.userId },
        data: {
          bannedAt: null,
          banReason: null,
          bannedById: null,
        },
        select: { id: true, email: true, bannedAt: true },
      })

      await logAdminAction(ctx.db, {
        actorId: ctx.session.user.id,
        action: 'USER_UNBANNED',
        targetType: 'user',
        targetId: input.userId,
        metadata: { email: existing?.email ?? updated.email },
      })

      return updated
    }),
}
