import 'server-only'

import { appRouter } from '@/server/api/root'
import { createPublicTRPCContext, createTRPCContext } from '@/server/api/trpc'

export function createPublicServerCaller() {
  return appRouter.createCaller(createPublicTRPCContext())
}

export async function createServerCaller() {
  const ctx = await createTRPCContext()
  return appRouter.createCaller(ctx)
}
