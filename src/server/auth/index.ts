import { cache } from 'react'
import NextAuth from 'next-auth'
import { authConfig } from './config'

const { handlers, auth: nextAuth, signIn, signOut } = NextAuth(authConfig)

/** Dedupe session reads within a single RSC request (layout + tRPC context). */
export const auth = cache(nextAuth)

export { handlers, signIn, signOut }
