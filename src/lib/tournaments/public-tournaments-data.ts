import type { inferRouterOutputs } from '@trpc/server'
import { createPublicServerCaller } from '@/lib/trpc/server'
import type { AppRouter } from '@/server/api/root'

export type PublicTournamentsList = inferRouterOutputs<AppRouter>['tournament']['getAll']

export async function getPublicTournamentsList(): Promise<PublicTournamentsList> {
  const caller = createPublicServerCaller()
  try {
    return await caller.tournament.getAll({ limit: 30 })
  } catch (error) {
    console.error('Failed to load public tournaments list:', error)
    return { tournaments: [], nextCursor: undefined }
  }
}
