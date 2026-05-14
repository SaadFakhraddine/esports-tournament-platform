'use client'

import { useSession } from 'next-auth/react'
import type { inferRouterOutputs } from '@trpc/server'
import type { AppRouter } from '@/server/api/root'
import { SiteFooter } from '@/components/layout/site-footer'
import { LandingNav } from '@/components/landing/landing-nav'
import { LandingHero } from '@/components/landing/landing-hero'
import { LandingSupportedGames } from '@/components/landing/landing-supported-games'
import { LandingForOrganizers } from '@/components/landing/landing-for-organizers'
import { LandingForPlayers } from '@/components/landing/landing-for-players'
import { LandingLiveUpcoming } from '@/components/landing/landing-live-upcoming'
import { LandingHallOfFame } from '@/components/landing/landing-leaderboards'
import { LandingHowItWorks } from '@/components/landing/landing-how-it-works'
import { LandingFinalCta } from '@/components/landing/landing-final-cta'

type LandingStats = inferRouterOutputs<AppRouter>['stats']

export interface LandingPageClientProps {
  platformStats: LandingStats['getPlatformStats']
  liveTournaments: LandingStats['getLiveTournaments']
  upcomingTournaments: LandingStats['getUpcomingTournaments']
  leaderboards: LandingStats['getLeaderboards']
}

export function LandingPageClient({
  platformStats,
  liveTournaments,
  upcomingTournaments,
  leaderboards,
}: LandingPageClientProps) {
  const { data: session } = useSession()
  const isOrganizer = session?.user?.role === 'ORGANIZER' || session?.user?.role === 'ADMIN'

  return (
    <div className='min-h-screen bg-black text-white overflow-hidden'>
      <div className='fixed inset-0 z-0'>
        <div className='absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-purple-500/10 to-pink-500/10 animate-pulse' />
        <div className='absolute inset-0 bg-[url("data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgwLDI1NSwyNTUsMC4xKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+")] opacity-20' />
      </div>

      <div className='relative z-10'>
        <LandingNav session={session ?? null} />
        <LandingHero session={session ?? null} isOrganizer={isOrganizer} platformStats={platformStats} />
        <LandingSupportedGames />
        <LandingForOrganizers />
        <LandingForPlayers />
        <LandingLiveUpcoming liveTournaments={liveTournaments} upcomingTournaments={upcomingTournaments} />
        <LandingHallOfFame leaderboardsLoading={false} leaderboards={leaderboards} />
        <LandingHowItWorks />
        <LandingFinalCta />
        <SiteFooter variant='dark' />
      </div>
    </div>
  )
}
