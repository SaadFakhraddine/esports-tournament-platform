'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { trpc } from '@/lib/trpc/client'

export function AdminOverviewStats() {
  const { data, isLoading } = trpc.admin.getOverview.useQuery()

  if (isLoading) {
    return (
      <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className='h-24 w-full' />
        ))}
      </div>
    )
  }

  if (!data) return null

  const stats = [
    { label: 'Users', value: data.userCount },
    { label: 'Games (active)', value: `${data.activeGameCount} / ${data.gameCount}` },
    { label: 'Tournaments', value: data.tournamentCount },
    { label: 'Suspended accounts', value: data.bannedCount },
  ]

  return (
    <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
      {stats.map((stat) => (
        <Card key={stat.label}>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium text-muted-foreground'>
              {stat.label}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className='text-2xl font-bold'>{stat.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
