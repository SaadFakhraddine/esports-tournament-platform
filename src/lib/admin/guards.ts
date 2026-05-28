import { TRPCError } from '@trpc/server'
import type { PrismaClient, UserRole } from '@prisma/client'

export async function assertNotSelf(actorId: string, targetUserId: string): Promise<void> {
  if (actorId === targetUserId) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'You cannot perform this action on your own account',
    })
  }
}

export async function assertNotLastAdmin(
  db: PrismaClient,
  targetUserId: string,
  targetRole: UserRole,
): Promise<void> {
  if (targetRole !== 'ADMIN') {
    return
  }

  const adminCount = await db.user.count({
    where: { role: 'ADMIN', bannedAt: null },
  })

  const target = await db.user.findUnique({
    where: { id: targetUserId },
    select: { role: true, bannedAt: true },
  })

  if (target?.role === 'ADMIN' && !target.bannedAt && adminCount <= 1) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Cannot remove or suspend the last active admin',
    })
  }
}

export async function assertCanBanUser(
  db: PrismaClient,
  actorId: string,
  targetUserId: string,
): Promise<void> {
  await assertNotSelf(actorId, targetUserId)

  const target = await db.user.findUnique({
    where: { id: targetUserId },
    select: { role: true, bannedAt: true },
  })

  if (!target) {
    throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found' })
  }

  if (target.role === 'ADMIN' && !target.bannedAt) {
    await assertNotLastAdmin(db, targetUserId, 'ADMIN')
  }
}
