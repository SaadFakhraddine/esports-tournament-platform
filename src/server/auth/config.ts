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
import {
  oauthBanCheck,
  provisionOAuthUser,
  validateOAuthEmail,
} from '@/server/auth/oauth-provision'

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
      if (account?.provider === 'credentials') {
        if (user.id) {
          return oauthBanCheck(user.id)
        }
        return true
      }

      if (account?.provider === 'google' || account?.provider === 'discord') {
        const emailCheck = validateOAuthEmail(account.provider, user.email, profile)
        if (!emailCheck.ok) {
          console.warn(`[auth] OAuth sign-in rejected (${account.provider}): ${emailCheck.reason}`)
          return false
        }

        try {
          await provisionOAuthUser(user, account)
          if (user.id) {
            return oauthBanCheck(user.id)
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
