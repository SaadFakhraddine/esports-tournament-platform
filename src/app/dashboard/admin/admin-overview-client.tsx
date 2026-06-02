'use client'

import dynamic from 'next/dynamic'
import { Skeleton } from '@/components/ui/skeleton'

const AdminOverviewStats = dynamic(
  () => import('@/components/admin/admin-overview-stats').then((m) => m.AdminOverviewStats),
  {
    loading: () => (
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className='h-28 rounded-lg' />
        ))}
      </div>
    ),
  },
)

export function AdminOverviewClient() {
  return <AdminOverviewStats />
}
