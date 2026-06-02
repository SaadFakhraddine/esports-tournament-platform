import type { Account, Profile, User } from 'next-auth'
import { db } from '@/server/db/client'
import { isUserBanned } from '@/lib/user/ban'

type OAuthAccount = Pick<
  Account,
  | 'type'
  | 'provider'
  | 'providerAccountId'
  | 'access_token'
  | 'refresh_token'
  | 'expires_at'
  | 'token_type'
  | 'scope'
  | 'id_token'
> & {
  session_state?: string | null
}

export function validateOAuthEmail(
  provider: string,
  email: string | null | undefined,
  profile?: Profile | null,
): { ok: true } | { ok: false; reason: string } {
  if (!email) {
    const hint =
      provider === 'discord'
        ? 'Discord requires a verified email on the account (email scope).'
        : 'This OAuth provider did not return an email; check scopes and consent screen.'
    return { ok: false, reason: hint }
  }

  if (
    provider === 'google' &&
    profile &&
    typeof profile === 'object' &&
    'email_verified' in profile &&
    (profile as { email_verified?: boolean }).email_verified !== true
  ) {
    return { ok: false, reason: 'Google sign-in rejected: email_verified is false' }
  }

  return { ok: true }
}

function accountLinkData(userId: string, account: OAuthAccount) {
  return {
    userId,
    type: account.type,
    provider: account.provider,
    providerAccountId: account.providerAccountId,
    access_token: account.access_token,
    refresh_token: account.refresh_token,
    expires_at: account.expires_at,
    token_type: account.token_type,
    scope: account.scope,
    id_token: account.id_token,
    session_state: typeof account.session_state === 'string' ? account.session_state : null,
  }
}

/**
 * Links or creates a user for Google/Discord sign-in. Mutates `user.id` on success.
 */
export async function provisionOAuthUser(user: User, account: OAuthAccount): Promise<void> {
  if (!user.email) {
    throw new Error('OAuth user email is required')
  }

  const existingUser = await db.user.findUnique({
    where: { email: user.email },
  })

  if (!existingUser) {
    const newUser = await db.user.create({
      data: {
        email: user.email,
        name: user.name,
        avatar: user.image,
        emailVerified: new Date(),
      },
    })

    await db.account.create({
      data: accountLinkData(newUser.id, account),
    })

    user.id = newUser.id
    return
  }

  const existingAccount = await db.account.findUnique({
    where: {
      provider_providerAccountId: {
        provider: account.provider,
        providerAccountId: account.providerAccountId,
      },
    },
  })

  if (!existingAccount) {
    await db.account.create({
      data: accountLinkData(existingUser.id, account),
    })
  }

  user.id = existingUser.id
}

export async function oauthBanCheck(userId: string): Promise<string | true> {
  const dbUser = await db.user.findUnique({
    where: { id: userId },
    select: { bannedAt: true },
  })
  if (isUserBanned(dbUser?.bannedAt)) {
    return '/login?error=AccountSuspended'
  }
  return true
}
