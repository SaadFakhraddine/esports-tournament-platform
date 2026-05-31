import { z } from 'zod'
import { AdminAuditAction } from '@prisma/client'
import { adminProcedure } from '@/server/api/trpc'

const listAuditLogSchema = z.object({
  action: z.nativeEnum(AdminAuditAction).optional(),
  limit: z.number().min(1).max(100).default(50),
  cursor: z.string().cuid().optional(),
})

export const adminAudit = {
  listAuditLog: adminProcedure.input(listAuditLogSchema).query(async ({ ctx, input }) => {
    const entries = await ctx.db.adminAuditLog.findMany({
      where: input.action ? { action: input.action } : undefined,
      take: input.limit + 1,
      ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        action: true,
        targetType: true,
        targetId: true,
        metadata: true,
        createdAt: true,
        actor: { select: { email: true } },
      },
    })

    let nextCursor: string | undefined
    if (entries.length > input.limit) {
      const next = entries.pop()
      nextCursor = next?.id
    }

    return { entries, nextCursor }
  }),
}
