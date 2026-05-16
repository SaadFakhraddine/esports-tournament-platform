'use client'

import { Suspense } from 'react'
import { TeamsBrowse } from '@/components/browse/teams-browse'
import { Skeleton } from '@/components/ui/skeleton'

function TeamsBrowseSkeleton() {
  return (
    <div className='space-y-6'>
      <Skeleton className='h-10 w-48' />
      <Skeleton className='h-10 w-full max-w-xl' />
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className='h-48 w-full' />
        ))}
      </div>
    </div>
  )
}

export default function DashboardDiscoverTeamsPage() {
  return (
    <Suspense fallback={<TeamsBrowseSkeleton />}>
      <TeamsBrowse listBasePath='/dashboard/discover/teams' homeHref='/dashboard' />
    </Suspense>
  )
}
