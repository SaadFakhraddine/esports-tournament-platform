'use client'

import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react'
import { SessionBanWatcher } from '@/components/providers/session-ban-watcher'

export function SessionProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextAuthSessionProvider refetchInterval={30} refetchOnWindowFocus>
      <SessionBanWatcher />
      {children}
    </NextAuthSessionProvider>
  )
}
