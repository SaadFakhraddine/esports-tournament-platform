'use client'

import { TRPCClientError } from '@trpc/client'
import { signOut } from 'next-auth/react'

const SUSPENDED_LOGIN_URL = '/login?error=AccountSuspended'

export function isAccountSuspendedTrpcError(error: unknown): boolean {
  if (!(error instanceof TRPCClientError)) return false
  return (
    error.data?.code === 'FORBIDDEN' &&
    typeof error.message === 'string' &&
    error.message.toLowerCase().includes('suspended')
  )
}

export function handleAccountSuspendedClient(error: unknown): void {
  if (!isAccountSuspendedTrpcError(error)) return
  void signOut({ callbackUrl: SUSPENDED_LOGIN_URL })
}
