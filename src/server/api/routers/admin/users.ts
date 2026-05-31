import { z } from 'zod'
import { UserRole } from '@prisma/client'
import { TRPCError } from '@trpc/server'
import { adminProcedure } from '@/server/api/trpc'
import { assertNotLastAdmin, assertNotSelf } from '@/lib/admin/guards'
import { logAdminAction } from '@/lib/admin/audit'

const listUsersSchema = z.object({
  search: z.string().optional(),
  role: z.nativeEnum(UserRole).optional(),
  bannedOnly: z.boolean().optional(),
  limit: z.number().min(1).max(100).default(50),
  cursor: z.string().cuid().optional(),
})

export const adminUsers = {
  listUsers: adminProcedure.input(listUsersSchema).query(async ({ ctx, input }) => {
    const search = input.search?.trim()

    const users = await ctx.db.user.findMany({
      where: {
        ...(input.role ? { role: input.role } : {}),
        ...(input.bannedOnly ? { bannedAt: { not: null } } : {}),
        ...(search
          ? {
              OR: [
                { email: { contains: search, mode: 'insensitive' } },
                { name: { contains: search, mode: 'insensitive' } },
                { username: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      take: input.limit + 1,
      ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        name: true,
        username: true,
        role: true,
        bannedAt: true,
        banReason: true,
        createdAt: true,
        bannedBy: { select: { id: true, email: true } },
        _count: {
          select: {
            organizedTournaments: true,
            teamMemberships: true,
          },
        },
      },
    })

    let nextCursor: string | undefined
    if (users.length > input.limit) {
      const next = users.pop()
      nextCursor = next?.id
    }

    return { users, nextCursor }
  }),

  updateUserRole: adminProcedure
    .input(
      z.object({
        userId: z.string().cuid(),
        role: z.nativeEnum(UserRole),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await assertNotSelf(ctx.session.user.id, input.userId)

      const target = await ctx.db.user.findUnique({
        where: { id: input.userId },
        select: { role: true, bannedAt: true },
      })

      if (!target) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found' })
      }

      if (target.role === 'ADMIN' && input.role !== 'ADMIN') {
        await assertNotLastAdmin(ctx.db, input.userId, 'ADMIN')
      }

      const updated = await ctx.db.user.update({
        where: { id: input.userId },
        data: { role: input.role },
        select: { id: true, email: true, role: true },
      })

      await logAdminAction(ctx.db, {
        actorId: ctx.session.user.id,
        action: 'USER_ROLE_CHANGED',
        targetType: 'user',
        targetId: input.userId,
        metadata: { fromRole: target.role, toRole: input.role, email: updated.email },
      })

      return updated
    }),
}
