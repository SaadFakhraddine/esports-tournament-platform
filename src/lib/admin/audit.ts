import type { AdminAuditAction, Prisma, PrismaClient } from '@prisma/client'

type AuditDb = PrismaClient | Prisma.TransactionClient

export async function logAdminAction(
  db: AuditDb,
  params: {
    actorId: string
    action: AdminAuditAction
    targetType: 'user' | 'game'
    targetId: string
    metadata?: Record<string, unknown>
  },
): Promise<void> {
  await db.adminAuditLog.create({
    data: {
      actorId: params.actorId,
      action: params.action,
      targetType: params.targetType,
      targetId: params.targetId,
      metadata: params.metadata ?? undefined,
    },
  })
}
