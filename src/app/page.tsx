import { appRouter } from '@/server/api/root'
import { createTRPCContext } from '@/server/api/trpc'
import { LandingPageClient } from '@/components/landing/landing-page-client'

export default async function HomePage() {
  const ctx = await createTRPCContext()
  const caller = appRouter.createCaller(ctx)

  const [platformStats, liveTournaments, upcomingTournaments, leaderboards] = await Promise.all([
    caller.stats.getPlatformStats(),
    caller.stats.getLiveTournaments(),
    caller.stats.getUpcomingTournaments(),
    caller.stats.getLeaderboards(),
  ])

  return (
    <LandingPageClient
      session={ctx.session}
      platformStats={platformStats}
      liveTournaments={liveTournaments}
      upcomingTournaments={upcomingTournaments}
      leaderboards={leaderboards}
    />
  )
}
