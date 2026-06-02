'use client'

import { useEffect } from 'react'
import { signOut, useSession } from 'next-auth/react'

const SUSPENDED_LOGIN_URL = '/login?error=AccountSuspended'

/** Signs out when the session carries a ban flag (after server-side JWT refresh). */
export function SessionBanWatcher() {
  const { data: session } = useSession()

  useEffect(() => {
    if (session?.user?.bannedAt) {
      void signOut({ callbackUrl: SUSPENDED_LOGIN_URL })
    }
  }, [session?.user?.bannedAt])

  return null
}
