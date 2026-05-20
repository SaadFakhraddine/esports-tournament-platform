'use client'

import { Suspense } from 'react'
import { useSession } from 'next-auth/react'
import { redirect, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { TournamentForm } from '@/components/tournament/tournament-form'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Sparkles } from 'lucide-react'

function CreateTournamentContent() {
  const searchParams = useSearchParams()
  const fromPlanner = searchParams.get('from') === 'planner'
  const formatParam = searchParams.get('format')
  const maxTeamsParam = searchParams.get('maxTeams')

  const maxTeams = maxTeamsParam ? parseInt(maxTeamsParam, 10) : undefined

  const plannerDefaults =
    fromPlanner && (formatParam || maxTeams)
      ? {
          format: formatParam ?? undefined,
          maxTeams: Number.isFinite(maxTeams) ? maxTeams : undefined,
        }
      : undefined

  return (
    <div className='max-w-3xl mx-auto space-y-6'>
      <div>
        <h1 className='text-3xl font-bold tracking-tight'>Create Tournament</h1>
        <p className='text-muted-foreground mt-2'>
          Set up a new competitive tournament for your game
        </p>
      </div>

      {fromPlanner && plannerDefaults && (
        <Alert>
          <Sparkles className='h-4 w-4' />
          <AlertDescription>
            Format and team cap were filled from the Bracket Designer. Adjust any field before
            creating.
          </AlertDescription>
        </Alert>
      )}

      <div className='flex justify-end'>
        <Button variant='outline' size='sm' asChild>
          <Link href='/dashboard/tournaments/planner'>Open Bracket Designer</Link>
        </Button>
      </div>

      <TournamentForm mode='create' plannerDefaults={plannerDefaults} />
    </div>
  )
}

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
    <Suspense fallback={<div>Loading...</div>}>
      <CreateTournamentContent />
    </Suspense>
  )
}
