'use client'

import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { TournamentForm } from '@/components/tournament/tournament-form'

export default function CreateTournamentPage() {
  const { data: session, status } = useSession()

  if (status === 'loading') {
    return <div>Loading...</div>
  }

  if (!session) {
    redirect('/login')
  }

  if (session.user.role !== 'ORGANIZER' && session.user.role !== 'ADMIN') {
    redirect('/tournaments')
  }

  return (
    <DashboardLayout userRole={session.user.role}>
      <div className='max-w-3xl mx-auto space-y-6'>
        {/* Page header */}
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>Create Tournament</h1>
          <p className='text-muted-foreground mt-2'>
            Set up a new competitive tournament for your game
          </p>
        </div>

        {/* Tournament form */}
        <TournamentForm mode='create' />
      </div>
    </DashboardLayout>
  )
}
