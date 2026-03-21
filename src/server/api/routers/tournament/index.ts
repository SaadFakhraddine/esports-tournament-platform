import { createTRPCRouter } from '@/server/api/trpc'
import { tournamentBracket } from './bracket'
import { tournamentCrud } from './crud'
import { tournamentQueries } from './queries'
import { tournamentRegistration } from './registration'

export const tournamentRouter = createTRPCRouter({
  ...tournamentQueries,
  ...tournamentCrud,
  ...tournamentRegistration,
  ...tournamentBracket,
})
