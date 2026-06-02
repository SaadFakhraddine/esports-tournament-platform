import type { NextAuthConfig } from 'next-auth'
import { CredentialsSignin } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import DiscordProvider from 'next-auth/providers/discord'
import { db } from '@/server/db/client'
import bcrypt from 'bcryptjs'
import { UserRole } from '@prisma/client'
import { isUserBanned } from '@/lib/user/ban'
import {
  getDiscordOAuthCredentials,
  getGoogleOAuthCredentials,
} from '@/server/auth/oauth-env'

const googleCreds = getGoogleOAuthCredentials()
const discordCreds = getDiscordOAuthCredentials()

class AccountSuspendedError extends CredentialsSignin {
  code = 'AccountSuspended'
}

/** Auth.js reads `provider.clientId` for the authorize URL; built-in providers only nest creds under `options`. */
const oauthProviders = [
  ...(googleCreds
    ? [
        {
          ...GoogleProvider(googleCreds),
          clientId: googleCreds.clientId,
          clientSecret: googleCreds.clientSecret,
        },
      ]
    : []),
  ...(discordCreds
    ? [
        {
          ...DiscordProvider(discordCreds),
          clientId: discordCreds.clientId,
          clientSecret: discordCreds.clientSecret,
        },
      ]
    : []),
]

export const authConfig: NextAuthConfig = {
  trustHost: true,
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials): Promise<{
        id: string
        email: string | null
        name: string | null
        username: string | null
        role: UserRole
        avatar: string | null
      } | null> {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await db.user.findUnique({
          where: {
            email: credentials.email as string,
          },
        })

        if (!user || !user.password) {
          return null
        }

        const isCorrectPassword = await bcrypt.compare(credentials.password as string, user.password)

        if (!isCorrectPassword) {
          return null
        }

        if (isUserBanned(user.bannedAt)) {
          throw new AccountSuspendedError()
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          username: user.username,
          role: user.role,
          avatar: user.avatar,
        }
      },
    }),
    ...oauthProviders,
  ],
  callbacks: {
    authorized({ auth }) {
      // This callback is used by middleware to check if user is authenticated
      return !!auth?.user
    },
    async signIn({ user, account, profile }) {
      const rejectBanned = async (userId: string) => {
        const dbUser = await db.user.findUnique({
          where: { id: userId },
          select: { bannedAt: true },
        })
        if (isUserBanned(dbUser?.bannedAt)) {
          return '/login?error=AccountSuspended'
        }
        return true
      }

      if (account?.provider === 'credentials') {
        if (user.id) {
          return rejectBanned(user.id)
        }
        return true
      }

      // Handle OAuth providers (Google, Discord)
      if (account?.provider === 'google' || account?.provider === 'discord') {
        if (!user.email) {
          const hint =
            account.provider === 'discord'
              ? 'Discord requires a verified email on the account (email scope).'
              : 'This OAuth provider did not return an email; check scopes and consent screen.'
          console.warn(`[auth] OAuth sign-in rejected: missing email (${account.provider}). ${hint}`)
          return false
        }

        if (
          account.provider === 'google' &&
          profile &&
          typeof profile === 'object' &&
          'email_verified' in profile &&
          (profile as { email_verified?: boolean }).email_verified !== true
        ) {
          console.warn('[auth] Google sign-in rejected: email_verified is false')
          return false
        }

        try {
          // Check if user exists
          const existingUser = await db.user.findUnique({
            where: { email: user.email },
          })

          if (!existingUser) {
            // Create new user for OAuth
            const newUser = await db.user.create({
              data: {
                email: user.email,
                name: user.name,
                avatar: user.image,
                emailVerified: new Date(),
              },
            })

            // Create account link
            await db.account.create({
              data: {
                userId: newUser.id,
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
              },
            })

            user.id = newUser.id
          } else {
            // Check if account is already linked
            const existingAccount = await db.account.findUnique({
              where: {
                provider_providerAccountId: {
                  provider: account.provider,
                  providerAccountId: account.providerAccountId,
                },
              },
            })

            if (!existingAccount) {
              // Link account to existing user
              await db.account.create({
                data: {
                  userId: existingUser.id,
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
                },
              })
            }

            user.id = existingUser.id
          }

          if (user.id) {
            return rejectBanned(user.id)
          }

          return true
        } catch (error) {
          console.error('OAuth sign in error:', error)
          return false
        }
      }

      return true
    },
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id
        token.email = user.email ?? token.email

        // Fetch user data from database to get role and username
        const dbUser = await db.user.findUnique({
          where: { id: user.id },
          select: { role: true, username: true, email: true, name: true, avatar: true, bannedAt: true },
        })

        if (dbUser) {
          if (isUserBanned(dbUser.bannedAt)) {
            return null
          }
          token.role = dbUser.role
          token.username = dbUser.username
          token.email = dbUser.email
          token.bannedAt = dbUser.bannedAt?.toISOString() ?? null
          if (dbUser.name) token.name = dbUser.name
          if (dbUser.avatar) token.picture = dbUser.avatar
        }
      }

      if (!user && token.id && token.bannedAt === undefined) {
        const dbUser = await db.user.findUnique({
          where: { id: token.id as string },
          select: { bannedAt: true },
        })
        token.bannedAt = dbUser?.bannedAt?.toISOString() ?? null
      }

      // Handle session update (e.g. profile name/username from client `update()`)
      if (trigger === 'update' && session && typeof session === 'object') {
        const s = session as {
          user?: Partial<{ name?: string | null; username?: string | null; image?: string | null }>
        }
        if (s.user?.name !== undefined) token.name = s.user.name
        if (s.user && 'username' in s.user) {
          token.username = (s.user.username ?? null) as typeof token.username
        }
        if (s.user?.image !== undefined) token.picture = s.user.image
      }

      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as UserRole
        session.user.username = token.username as string | null
        session.user.bannedAt = (token.bannedAt as string | null | undefined) ?? null
        if (token.name) session.user.name = token.name as string
        if (token.picture) session.user.image = token.picture as string
      }
      return session
    },
  },
}
