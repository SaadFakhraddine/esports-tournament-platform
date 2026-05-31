import { createTRPCRouter } from '@/server/api/trpc'
import { adminOverview } from './overview'
import { adminGames } from './games'
import { adminUsers } from './users'
import { adminUsersBan } from './users-ban'
import { adminAudit } from './audit'

export const adminRouter = createTRPCRouter({
  ...adminOverview,
  ...adminGames,
  ...adminUsers,
  ...adminUsersBan,
  ...adminAudit,
})
