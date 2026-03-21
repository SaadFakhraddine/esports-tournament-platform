import type { NextAuthConfig } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import DiscordProvider from 'next-auth/providers/discord'
import { db } from '@/server/db/client'
import bcrypt from 'bcryptjs'
import { UserRole } from '@prisma/client'

export const authConfig: NextAuthConfig = {
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
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    authorized({ auth }) {
      // This callback is used by middleware to check if user is authenticated
      return !!auth?.user
    },
    async signIn({ user, account }) {
      // Allow credentials sign in
      if (account?.provider === 'credentials') {
        return true
      }

      // Handle OAuth providers (Google, Discord)
      if (account?.provider === 'google' || account?.provider === 'discord') {
        try {
          // Check if user exists
          const existingUser = await db.user.findUnique({
            where: { email: user.email! },
          })

          if (!existingUser) {
            // Create new user for OAuth
            const newUser = await db.user.create({
              data: {
                email: user.email!,
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

          return true
        } catch (error) {
          console.error('OAuth sign in error:', error)
          return false
        }
      }

      return true
    },
    async jwt({ token, user, trigger, session }) {
      type TokenExtras = { invalidSession?: boolean; email?: string | null }

      if (user) {
        delete (token as TokenExtras).invalidSession
        token.id = user.id
        token.email = user.email ?? token.email

        // Fetch user data from database to get role and username
        const dbUser = await db.user.findUnique({
          where: { id: user.id },
          select: { role: true, username: true, email: true },
        })

        if (dbUser) {
          token.role = dbUser.role
          token.username = dbUser.username
          token.email = dbUser.email
        }
      } else {
        // JWT keeps old `id` after DB reset / user deleted — resync from DB or invalidate
        const tokenId = typeof token.id === 'string' ? token.id : undefined
        const tokenEmail =
          typeof token.email === 'string' && token.email.length > 0 ? token.email : undefined

        let dbUser =
          tokenId != null
            ? await db.user.findUnique({
                where: { id: tokenId },
                select: { id: true, email: true, role: true, username: true },
              })
            : null

        if (!dbUser && tokenEmail) {
          dbUser = await db.user.findUnique({
            where: { email: tokenEmail },
            select: { id: true, email: true, role: true, username: true },
          })
        }

        if (dbUser) {
          token.id = dbUser.id
          token.email = dbUser.email
          token.role = dbUser.role
          token.username = dbUser.username
          delete (token as TokenExtras).invalidSession
        } else if (tokenId || tokenEmail) {
          ;(token as TokenExtras).invalidSession = true
        }
      }

      // Handle session update
      if (trigger === 'update' && session) {
        token = { ...token, ...session }
      }

      return token
    },
    async session({ session, token }) {
      if ((token as { invalidSession?: boolean }).invalidSession) {
        return { ...session, user: undefined as typeof session.user }
      }
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as UserRole
        session.user.username = token.username as string | null
      }
      return session
    },
  },
}
