import type { inferRouterOutputs } from '@trpc/server'
import type { AppRouter } from '@/server/api/root'

export type PlayerStatsOutput = inferRouterOutputs<AppRouter>['user']['getPlayerStats']
export type StatsRange = '3m' | '6m' | '12m' | 'all'

export const RANGE_OPTIONS: { value: StatsRange; label: string }[] = [
  { value: '3m', label: 'Last 3 months' },
  { value: '6m', label: 'Last 6 months' },
  { value: '12m', label: 'Last 12 months' },
  { value: 'all', label: 'All time' },
]
