import { createTRPCRouter } from '@/server/api/trpc'
import { matchQueries } from './match/queries'
import { matchResults } from './match/results'
import { matchScheduling } from './match/scheduling'

export const matchRouter = createTRPCRouter({
  ...matchQueries,
  ...matchResults,
  ...matchScheduling,
})
