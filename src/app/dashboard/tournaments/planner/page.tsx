'use client'

import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { BracketPlanner } from '@/components/bracket-planner/bracket-planner'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export default function BracketPlannerPage() {
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
    <div className='max-w-6xl mx-auto space-y-6'>
      <div className='flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between'>
        <div>
          <Button variant='ghost' size='sm' className='-ml-2 mb-2' asChild>
            <Link href='/dashboard/tournaments'>
              <ArrowLeft className='h-4 w-4 mr-1' />
              Back to tournaments
            </Link>
          </Button>
          <h1 className='text-3xl font-bold tracking-tight'>Bracket Designer</h1>
          <p className='text-muted-foreground mt-2'>
            Plan your tournament format and preview the bracket before you create the event.
          </p>
        </div>
      </div>

      <BracketPlanner />
    </div>
  )
}
