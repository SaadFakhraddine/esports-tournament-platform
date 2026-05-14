import { createPublicServerCaller } from '@/lib/trpc/server'
import { LandingPageClient } from '@/components/landing/landing-page-client'

export const revalidate = 60

export default async function HomePage() {
  const caller = createPublicServerCaller()

  const [platformStats, liveTournaments, upcomingTournaments, leaderboards] = await Promise.all([
    caller.stats.getPlatformStats(),
    caller.stats.getLiveTournaments(),
    caller.stats.getUpcomingTournaments(),
    caller.stats.getLeaderboards(),
  ])

  return (
    <LandingPageClient
      platformStats={platformStats}
      liveTournaments={liveTournaments}
      upcomingTournaments={upcomingTournaments}
      leaderboards={leaderboards}
    />
  )
}
