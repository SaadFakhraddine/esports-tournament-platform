import { LandingPageClient } from '@/components/landing/landing-page-client'
import { getLandingPageData } from '@/lib/landing/landing-page-data'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const { platformStats, liveTournaments, upcomingTournaments, leaderboards } = await getLandingPageData()

  return (
    <LandingPageClient
      platformStats={platformStats}
      liveTournaments={liveTournaments}
      upcomingTournaments={upcomingTournaments}
      leaderboards={leaderboards}
    />
  )
}
