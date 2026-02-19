import { createTRPCRouter } from '@/server/api/trpc'
import { tournamentRouter } from '@/server/api/routers/tournament'
import { teamRouter } from '@/server/api/routers/team'
import { matchRouter } from '@/server/api/routers/match'
import { userRouter } from '@/server/api/routers/user'
import { invitationRouter } from '@/server/api/routers/invitation'
import { gameRouter } from '@/server/api/routers/game'
import { statsRouter } from '@/server/api/routers/stats'

export const appRouter = createTRPCRouter({
  tournament: tournamentRouter,
  team: teamRouter,
  match: matchRouter,
  user: userRouter,
  invitation: invitationRouter,
  game: gameRouter,
  stats: statsRouter,
})

export type AppRouter = typeof appRouter
