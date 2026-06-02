import { createTRPCRouter } from '@/server/api/trpc'
import { tournamentBracket } from './bracket'
import { tournamentBracketPlanner } from './bracket-planner'
import { tournamentCrud } from './crud'
import { tournamentQueries } from './queries'
import { tournamentRegistration } from './registration'
import { tournamentActivity } from './activity'

export const tournamentRouter = createTRPCRouter({
  ...tournamentQueries,
  ...tournamentCrud,
  ...tournamentRegistration,
  ...tournamentBracket,
  ...tournamentBracketPlanner,
  ...tournamentActivity,
})
