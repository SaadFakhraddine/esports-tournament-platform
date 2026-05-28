import { TRPCError } from '@trpc/server'

export function isUserBanned(bannedAt: Date | null | undefined): boolean {
  return bannedAt != null
}

export function assertUserNotBanned(bannedAt: Date | null | undefined): void {
  if (isUserBanned(bannedAt)) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Your account has been suspended',
    })
  }
}
