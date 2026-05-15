import { redirect } from 'next/navigation'
import { auth } from '@/server/auth'
import { DashboardLayout } from '@/components/layout/dashboard-layout'

export const dynamic = 'force-dynamic'

export default async function DashboardRootLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user) {
    redirect('/login')
  }

  return <DashboardLayout userRole={session.user.role}>{children}</DashboardLayout>
}
