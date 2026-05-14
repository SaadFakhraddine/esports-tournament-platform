import type { inferRouterOutputs } from '@trpc/server'
import { createPublicServerCaller } from '@/lib/trpc/server'
import type { AppRouter } from '@/server/api/root'

type LandingStats = inferRouterOutputs<AppRouter>['stats']

export type LandingPageData = {
  platformStats: LandingStats['getPlatformStats']
  liveTournaments: LandingStats['getLiveTournaments']
  upcomingTournaments: LandingStats['getUpcomingTournaments']
  leaderboards: LandingStats['getLeaderboards']
}

const emptyLandingPageData: LandingPageData = {
  platformStats: {
    totalTournaments: 0,
    totalTeams: 0,
    completedTournaments: 0,
    tournamentsWithPrizes: 0,
  },
  liveTournaments: [],
  upcomingTournaments: [],
  leaderboards: {
    topTeams: [],
    topPlayers: [],
    recentChampions: [],
  },
}

export async function getLandingPageData(): Promise<LandingPageData> {
  const caller = createPublicServerCaller()

  try {
    const [platformStats, liveTournaments, upcomingTournaments, leaderboards] = await Promise.all([
      caller.stats.getPlatformStats(),
      caller.stats.getLiveTournaments(),
      caller.stats.getUpcomingTournaments(),
      caller.stats.getLeaderboards(),
    ])

    return {
      platformStats,
      liveTournaments,
      upcomingTournaments,
      leaderboards,
    }
  } catch (error) {
    console.error('Failed to load landing page stats:', error)
    return emptyLandingPageData
  }
}
