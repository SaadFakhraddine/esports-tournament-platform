import { UserRole } from '@prisma/client'
import type { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      role: UserRole
      username: string | null
      bannedAt: string | null
    } & DefaultSession['user']
  }

  interface User {
    role: UserRole
    username: string | null
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: UserRole
    username: string | null
    name?: string | null
    picture?: string | null
    bannedAt?: string | null
  }
}
