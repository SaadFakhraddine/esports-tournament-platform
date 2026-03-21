'use client'

import { useState } from 'react'
import { trpc } from '@/lib/trpc/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Lock, LockOpen, AlertCircle, Info, Loader2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface RegistrationControlProps {
  tournament: {
    id: string
    name: string
    status: string
    registrationStart: Date
    registrationEnd: Date
  }
  currentRegistrationsCount: number
  maxTeams: number
}

export function RegistrationControl({
  tournament,
  currentRegistrationsCount,
  maxTeams,
}: RegistrationControlProps) {
  const [error, setError] = useState<string | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const utils = trpc.useUtils()

  const updateStatusMutation = trpc.tournament.update.useMutation({
    onSuccess: () => {
      setError(null)
      setIsDialogOpen(false)
      // Invalidate and refetch tournament data
      utils.tournament.getById.invalidate({ id: tournament.id })
      utils.tournament.getRegistrations.invalidate({ tournamentId: tournament.id })
    },
    onError: (err) => {
      setError(err.message)
    },
  })

  const isRegistrationOpen = tournament.status === 'REGISTRATION'
  const canCloseRegistration = tournament.status === 'REGISTRATION'
  const canOpenRegistration = tournament.status === 'DRAFT'
  const registrationLocked =
    tournament.status === 'SEEDING' ||
    tournament.status === 'IN_PROGRESS' ||
    tournament.status === 'COMPLETED' ||
    tournament.status === 'CANCELLED'

  const handleCloseRegistration = () => {
    updateStatusMutation.mutate({
      id: tournament.id,
      status: 'SEEDING',
      registrationEnd: new Date(),
    })
  }

  const handleOpenRegistration = () => {
    const now = new Date()
    updateStatusMutation.mutate({
      id: tournament.id,
      status: 'REGISTRATION',
      registrationStart: now,
      registrationEnd:
        tournament.registrationEnd && new Date(tournament.registrationEnd).getTime() > now.getTime()
          ? new Date(tournament.registrationEnd)
          : new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
    })
  }

  const now = new Date()
  const regStart = new Date(tournament.registrationStart)
  const regEnd = new Date(tournament.registrationEnd)
  const isBeforeStart = now < regStart
  const isAfterEnd = now > regEnd

  return (
    <Card>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <div>
            <CardTitle className='flex items-center gap-2'>
              {isRegistrationOpen ? (
                <LockOpen className='h-5 w-5 text-green-500' />
              ) : (
                <Lock className='h-5 w-5 text-muted-foreground' />
              )}
              Registration Control
            </CardTitle>
            <CardDescription>
              Manually lock or unlock team registration
            </CardDescription>
          </div>
          <Badge
            variant='outline'
            className={
              isRegistrationOpen
                ? 'bg-green-500/10 text-green-500 border-green-500/20'
                : 'bg-gray-500/10 text-gray-500 border-gray-500/20'
            }
          >
            {isRegistrationOpen ? 'Open' : 'Closed'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className='space-y-4'>
        {/* Current Status Info */}
        <div className='space-y-2'>
          <div className='flex items-center justify-between text-sm'>
            <span className='text-muted-foreground'>Registered Teams:</span>
            <span className='font-medium'>
              {currentRegistrationsCount} / {maxTeams}
            </span>
          </div>
          <div className='flex items-center justify-between text-sm'>
            <span className='text-muted-foreground'>Tournament Status:</span>
            <Badge variant='secondary'>{tournament.status}</Badge>
          </div>
        </div>

        {/* Date-based status info */}
        <Alert>
          <Info className='h-4 w-4' />
          <AlertDescription className='text-sm'>
            {isRegistrationOpen ? (
              <>
                {isBeforeStart && (
                  <>Registration scheduled to open {regStart.toLocaleDateString()}</>
                )}
                {!isBeforeStart && !isAfterEnd && (
                  <>Registration scheduled to close {regEnd.toLocaleDateString()}</>
                )}
                {isAfterEnd && (
                  <>Registration period has passed, but you can keep it open</>
                )}
              </>
            ) : (
              <>
                {registrationLocked
                  ? 'Registration is closed and cannot be reopened after the tournament has left the registration phase.'
                  : 'Registration is closed. You can open it from draft to start accepting teams.'}
              </>
            )}
          </AlertDescription>
        </Alert>

        {error && (
          <Alert variant='destructive'>
            <AlertCircle className='h-4 w-4' />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Control Buttons */}
        <div className='space-y-2'>
          {registrationLocked ? (
            <Alert>
              <Info className='h-4 w-4' />
              <AlertDescription className='text-sm'>
                Registration cannot be reopened for this tournament. Create a new tournament to add teams.
              </AlertDescription>
            </Alert>
          ) : isRegistrationOpen ? (
            <AlertDialog open={isDialogOpen && !updateStatusMutation.isPending} onOpenChange={setIsDialogOpen}>
              <AlertDialogTrigger asChild>
                <Button
                  variant='destructive'
                  className='w-full'
                  disabled={updateStatusMutation.isPending || !canCloseRegistration}
                >
                  {updateStatusMutation.isPending ? (
                    <Loader2 className='h-4 w-4 mr-2 animate-spin' />
                  ) : (
                    <Lock className='h-4 w-4 mr-2' />
                  )}
                  Close Registration
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Close Registration?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will close registration and move the tournament to seeding. Teams will no longer be
                    able to register, and registration cannot be reopened later—create a new tournament if you
                    need a different lineup.
                    <br />
                    <br />
                    Current teams: {currentRegistrationsCount} / {maxTeams}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={updateStatusMutation.isPending}>
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleCloseRegistration}
                    className='bg-destructive hover:bg-destructive/90'
                    disabled={updateStatusMutation.isPending}
                  >
                    {updateStatusMutation.isPending && (
                      <Loader2 className='h-4 w-4 mr-2 animate-spin' />
                    )}
                    Close Registration
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : (
            <AlertDialog open={isDialogOpen && !updateStatusMutation.isPending} onOpenChange={setIsDialogOpen}>
              <AlertDialogTrigger asChild>
                <Button
                  variant='default'
                  className='w-full gradient-purple'
                  disabled={updateStatusMutation.isPending || !canOpenRegistration}
                >
                  {updateStatusMutation.isPending ? (
                    <Loader2 className='h-4 w-4 mr-2 animate-spin' />
                  ) : (
                    <LockOpen className='h-4 w-4 mr-2' />
                  )}
                  Open Registration
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Open Registration?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will open registration and allow teams to register for this tournament.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={updateStatusMutation.isPending}>
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleOpenRegistration}
                    disabled={updateStatusMutation.isPending}
                  >
                    {updateStatusMutation.isPending && (
                      <Loader2 className='h-4 w-4 mr-2 animate-spin' />
                    )}
                    Open Registration
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>

        {/* Helper Text */}
        <div className='text-xs text-muted-foreground space-y-1'>
          <p>
            <strong>Tip:</strong> Open registration from <strong>draft</strong>, then close it when you&apos;re
            ready to seed. Registration can&apos;t be reopened after seeding or play starts—create a new
            tournament if you need a different lineup.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
