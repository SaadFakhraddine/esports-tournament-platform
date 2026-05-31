import type { AdminAuditAction } from '@prisma/client'

const actionLabels: Record<AdminAuditAction, string> = {
  USER_ROLE_CHANGED: 'Role changed',
  USER_BANNED: 'Account suspended',
  USER_UNBANNED: 'Access restored',
  GAME_CREATED: 'Game added',
  GAME_UPDATED: 'Game updated',
  GAME_DELETED: 'Game deleted',
}

export function formatAuditAction(action: AdminAuditAction): string {
  return actionLabels[action] ?? action
}

export function formatAuditDetails(
  action: AdminAuditAction,
  metadata: Record<string, unknown> | null | undefined,
): string {
  if (!metadata) return '—'

  const email = typeof metadata.email === 'string' ? metadata.email : null
  const name = typeof metadata.name === 'string' ? metadata.name : null
  const reason = typeof metadata.reason === 'string' ? metadata.reason : null
  const fromRole = typeof metadata.fromRole === 'string' ? metadata.fromRole : null
  const toRole = typeof metadata.toRole === 'string' ? metadata.toRole : null

  switch (action) {
    case 'USER_ROLE_CHANGED':
      if (email && fromRole && toRole) return `${email}: ${fromRole} → ${toRole}`
      if (email) return email
      return '—'
    case 'USER_BANNED':
      if (email && reason) return `${email} — ${reason}`
      if (email) return email
      return '—'
    case 'USER_UNBANNED':
      return email ?? '—'
    case 'GAME_CREATED':
    case 'GAME_UPDATED':
    case 'GAME_DELETED':
      return name ?? email ?? '—'
    default:
      return '—'
  }
}
