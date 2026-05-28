import { redirect } from 'next/navigation'
import { auth } from '@/server/auth'
import { AdminSubNav } from '@/components/admin/admin-sub-nav'

export const dynamic = 'force-dynamic'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  if (session.user.role !== 'ADMIN') {
    redirect('/dashboard')
  }

  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-3xl font-bold tracking-tight'>Admin</h1>
        <p className='text-muted-foreground mt-2'>Platform management and moderation</p>
      </div>
      <AdminSubNav />
      {children}
    </div>
  )
}
