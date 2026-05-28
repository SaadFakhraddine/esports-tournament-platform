import { createTRPCRouter } from '@/server/api/trpc'
import { adminOverview } from './overview'
import { adminGames } from './games'
import { adminUsers } from './users'
import { adminUsersBan } from './users-ban'

export const adminRouter = createTRPCRouter({
  ...adminOverview,
  ...adminGames,
  ...adminUsers,
  ...adminUsersBan,
})
