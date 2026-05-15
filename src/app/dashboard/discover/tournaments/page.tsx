'use client'

import { Suspense } from 'react'
import { TournamentsBrowse, TournamentsBrowseSkeleton } from '@/components/browse/tournaments-browse'

export default function DashboardDiscoverTournamentsPage() {
  return (
    <Suspense fallback={<TournamentsBrowseSkeleton />}>
      <TournamentsBrowse listBasePath='/dashboard/discover/tournaments' homeHref='/dashboard' />
    </Suspense>
  )
}
