import { db } from '@/server/db/client'
import { isUserBanned } from '@/lib/user/ban'
import type { JWT } from 'next-auth/jwt'

/**
 * Re-read ban status from the DB on each session/JWT refresh so admin suspensions
 * take effect on the user's next request (without waiting for a new sign-in).
 * Returns null when the account is suspended so Auth.js clears the session.
 */
export async function applyFreshBanStatusToToken(token: JWT): Promise<JWT | null> {
  if (!token.id) return token

  const dbUser = await db.user.findUnique({
    where: { id: token.id as string },
    select: { bannedAt: true },
  })

  token.bannedAt = dbUser?.bannedAt?.toISOString() ?? null

  if (isUserBanned(dbUser?.bannedAt)) {
    return null
  }

  return token
}
