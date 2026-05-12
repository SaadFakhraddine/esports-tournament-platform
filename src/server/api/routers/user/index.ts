import { createTRPCRouter } from '@/server/api/trpc'
import { userActivity } from './activity'
import { userProfile } from './profile'
import { userRegistration } from './registration'
import { userSearch } from './search'
import { userStatsDashboard } from './stats-dashboard'
import { userStatsPlayer } from './stats-player'

export const userRouter = createTRPCRouter({
  ...userRegistration,
  ...userProfile,
  ...userStatsDashboard,
  ...userStatsPlayer,
  ...userSearch,
  ...userActivity,
})
