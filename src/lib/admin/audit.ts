import type { Prisma, PrismaClient } from '@prisma/client'

type AuditDb = PrismaClient | Prisma.TransactionClient

export type AdminAuditAction =
  | 'USER_ROLE_CHANGED'
  | 'USER_BANNED'
  | 'USER_UNBANNED'
  | 'GAME_CREATED'
  | 'GAME_UPDATED'
  | 'GAME_DELETED'

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
      metadata: (params.metadata ?? undefined) as Prisma.InputJsonValue | undefined,
    },
  })
}
