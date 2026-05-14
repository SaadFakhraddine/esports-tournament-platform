import { redirect } from 'next/navigation'
import { appRouter } from '@/server/api/root'
import { createTRPCContext } from '@/server/api/trpc'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { DashboardHome, type DashboardActivityItem } from '@/components/dashboard/dashboard-home'
import type { inferRouterOutputs } from '@trpc/server'
import type { AppRouter } from '@/server/api/root'

export const dynamic = 'force-dynamic'

type PersonalActivity = inferRouterOutputs<AppRouter>['user']['getRecentActivity']
type PlatformActivity = inferRouterOutputs<AppRouter>['stats']['getRecentActivity']

function mergeRecentActivity(personalActivity: PersonalActivity, platformActivity: PlatformActivity): DashboardActivityItem[] {
  const toDate = (d: Date | string) => (d instanceof Date ? d : new Date(d))

  const personal = personalActivity.map((a) => ({
    ...a,
    timestamp: toDate(a.timestamp),
  }))

  const platform = platformActivity.map((a) => ({
    id: `platform-${a.id}`,
    type: a.type,
    title:
      a.type === 'registration'
        ? 'Team registered'
        : a.type === 'completion'
          ? 'Tournament completed'
          : 'Registration opened',
    description: a.message,
    link: a.link,
    timestamp: toDate(a.timestamp),
  }))

  return [...personal, ...platform].sort((x, y) => y.timestamp.getTime() - x.timestamp.getTime()).slice(0, 8)
}

export default async function DashboardPage() {
  const ctx = await createTRPCContext()
  if (!ctx.session?.user) {
    redirect('/login?returnUrl=/dashboard')
  }

  const caller = appRouter.createCaller(ctx)
  const [stats, tournaments, teams, personalActivity, platformActivity] = await Promise.all([
    caller.user.getDashboardStats(),
    caller.tournament.getParticipatingTournaments({ limit: 3 }),
    caller.team.getMyTeams(),
    caller.user.getRecentActivity({ limit: 8 }),
    caller.stats.getRecentActivity({ limit: 12 }),
  ])

  const recentActivity = mergeRecentActivity(personalActivity, platformActivity)

  return (
    <DashboardLayout userRole={ctx.session.user.role}>
      <DashboardHome
        session={ctx.session}
        stats={stats}
        tournaments={tournaments}
        teams={teams}
        recentActivity={recentActivity}
      />
    </DashboardLayout>
  )
}
