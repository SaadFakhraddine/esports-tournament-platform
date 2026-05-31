'use client'

import Link from 'next/link'
import { Users, Gamepad2, Trophy, ShieldOff, ArrowRight } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { trpc } from '@/lib/trpc/client'
import { AdminPageHeader } from './admin-page-header'

const statConfig = [
  { key: 'userCount' as const, label: 'Users', icon: Users },
  { key: 'activeGameCount' as const, label: 'Active games', icon: Gamepad2, format: (d: OverviewData) => `${d.activeGameCount} / ${d.gameCount}` },
  { key: 'tournamentCount' as const, label: 'Tournaments', icon: Trophy },
  { key: 'bannedCount' as const, label: 'Suspended', icon: ShieldOff },
]

type OverviewData = {
  userCount: number
  gameCount: number
  activeGameCount: number
  tournamentCount: number
  bannedCount: number
  recentSuspensions: Array<{
    id: string
    email: string
    bannedAt: Date | null
    banReason: string | null
    bannedBy: { email: string } | null
  }>
}

export function AdminOverviewStats() {
  const { data, isLoading } = trpc.admin.getOverview.useQuery()

  if (isLoading) {
    return (
      <div className='space-y-6'>
        <AdminPageHeader title='Overview' description='Platform health at a glance.' />
        <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className='h-28 w-full' />
          ))}
        </div>
      </div>
    )
  }

  if (!data) return null

  return (
    <div className='space-y-6'>
      <AdminPageHeader title='Overview' description='Platform health at a glance.' />

      <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
        {statConfig.map((stat) => {
          const Icon = stat.icon
          const value =
            stat.format?.(data as OverviewData) ??
            String(data[stat.key as keyof typeof data] ?? '—')

          return (
            <Card key={stat.label}>
              <CardHeader className='flex flex-row items-center justify-between pb-2'>
                <CardTitle className='text-sm font-medium text-muted-foreground'>
                  {stat.label}
                </CardTitle>
                <Icon className='h-4 w-4 text-muted-foreground' />
              </CardHeader>
              <CardContent>
                <p className='text-2xl font-bold'>{value}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className='grid gap-4 lg:grid-cols-2'>
        <Card>
          <CardHeader>
            <CardTitle className='text-base'>Quick actions</CardTitle>
            <CardDescription>Jump to common admin tasks</CardDescription>
          </CardHeader>
          <CardContent className='flex flex-col gap-2'>
            <Button variant='outline' className='justify-between' asChild>
              <Link href='/dashboard/admin/users'>
                Manage users
                <ArrowRight className='h-4 w-4' />
              </Link>
            </Button>
            <Button variant='outline' className='justify-between' asChild>
              <Link href='/dashboard/admin/games'>
                Manage games
                <ArrowRight className='h-4 w-4' />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className='text-base'>Needs attention</CardTitle>
            <CardDescription>Recently suspended accounts</CardDescription>
          </CardHeader>
          <CardContent>
            {data.recentSuspensions.length === 0 ? (
              <p className='text-sm text-muted-foreground'>No suspended accounts.</p>
            ) : (
              <ul className='space-y-3'>
                {data.recentSuspensions.map((user) => (
                  <li key={user.id} className='text-sm'>
                    <p className='font-medium'>{user.email}</p>
                    <p className='text-muted-foreground text-xs mt-0.5'>
                      {user.bannedAt &&
                        new Date(user.bannedAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      {user.bannedBy && ` · by ${user.bannedBy.email}`}
                      {user.banReason && ` · ${user.banReason}`}
                    </p>
                  </li>
                ))}
              </ul>
            )}
            {data.bannedCount > 0 && (
              <Button variant='link' className='px-0 mt-3' asChild>
                <Link href='/dashboard/admin/users'>View all users</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
