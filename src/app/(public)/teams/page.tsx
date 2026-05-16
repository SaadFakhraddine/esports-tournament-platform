'use client'

import { Suspense } from 'react'
import { TeamsBrowse } from '@/components/browse/teams-browse'
import { Skeleton } from '@/components/ui/skeleton'

function TeamsBrowseSkeleton() {
  return (
    <div className='space-y-6'>
      <Skeleton className='h-10 w-48' />
      <Skeleton className='h-10 w-full max-w-xl' />
    </div>
  )
}

export default function TeamsPage() {
  return (
    <Suspense fallback={<TeamsBrowseSkeleton />}>
      <TeamsBrowse listBasePath='/teams' homeHref='/' />
    </Suspense>
  )
}
