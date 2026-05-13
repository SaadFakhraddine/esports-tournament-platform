'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { trpc } from '@/lib/trpc/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Trophy, AlertCircle } from 'lucide-react'
import { TournamentFormCoreFields } from './tournament-form/tournament-form-core-fields'
import { TournamentFormExtras } from './tournament-form/tournament-form-extras'
import { TournamentFormRegistration } from './tournament-form/tournament-form-registration'
import { TournamentFormSchedule } from './tournament-form/tournament-form-schedule'
import type { TournamentFormState, TournamentFormTournament } from './tournament-form/types'

export interface TournamentFormProps {
  tournament?: TournamentFormTournament
  mode?: 'create' | 'edit'
}

export function TournamentForm({ tournament, mode = 'create' }: TournamentFormProps) {
  const router = useRouter()
  const utils = trpc.useUtils()
  const [error, setError] = useState<string | null>(null)
  const [isTogglingRegistration, setIsTogglingRegistration] = useState(false)
  const [statusOverride, setStatusOverride] = useState<string | undefined>(tournament?.status)

  useEffect(() => {
    setStatusOverride(tournament?.status)
  }, [tournament?.status])

  const effectiveStatus = statusOverride ?? tournament?.status
  const isRegistrationPhaseOpen = effectiveStatus === 'REGISTRATION'

  const { data: games, isLoading: gamesLoading } = trpc.game.getAll.useQuery()

  const [formData, setFormData] = useState<TournamentFormState>({
    name: tournament?.name || '',
    description: tournament?.description || '',
    gameId: tournament?.game || '',
    format: tournament?.format || 'SINGLE_ELIMINATION',
    maxTeams: tournament?.maxTeams || 8,
    startDate: tournament?.startDate ? new Date(tournament.startDate) : null,
    endDate: tournament?.endDate ? new Date(tournament.endDate) : null,
    registrationStart: tournament?.registrationStart ? new Date(tournament.registrationStart) : null,
    registrationEnd: tournament?.registrationEnd ? new Date(tournament.registrationEnd) : null,
    rules: tournament?.rules || '',
    prizePool: tournament?.prizePool || '',
    banner: tournament?.banner || '',
  })

  const createMutation = trpc.tournament.create.useMutation({
    onSuccess: (data) => {
      router.push(`/tournaments/${data.id}`)
    },
    onError: (err) => {
      setError(err.message)
    },
  })

  const updateMutation = trpc.tournament.update.useMutation({
    onSuccess: (data) => {
      router.push(`/dashboard/tournaments/${data.id}/edit`)
      router.refresh()
    },
    onError: (err) => {
      setError(err.message)
    },
  })

  const toggleRegistrationMutation = trpc.tournament.update.useMutation({
    onSuccess: () => {
      setIsTogglingRegistration(false)
      if (tournament?.id) {
        utils.tournament.getManageOverviewById.invalidate({ id: tournament.id })
      }
    },
    onError: (err) => {
      setError(err.message)
      setIsTogglingRegistration(false)
    },
  })

  const handleToggleRegistration = () => {
    if (!tournament?.id) return

    setIsTogglingRegistration(true)
    const isCurrentlyOpen = isRegistrationPhaseOpen
    const now = new Date()
    const desiredRegistrationEnd = (() => {
      const current = formData.registrationEnd ?? now
      return current.getTime() < now.getTime() ? now : current
    })()

    if (isCurrentlyOpen) {
      setFormData((prev) => ({
        ...prev,
        registrationEnd: now,
      }))

      setStatusOverride('SEEDING')
      toggleRegistrationMutation.mutate({
        id: tournament.id,
        status: 'SEEDING',
        registrationEnd: now,
      })
    } else {
      setFormData((prev) => ({
        ...prev,
        registrationStart: now,
        registrationEnd: desiredRegistrationEnd,
      }))

      setStatusOverride('REGISTRATION')
      toggleRegistrationMutation.mutate({
        id: tournament.id,
        status: 'REGISTRATION',
        registrationStart: now,
        registrationEnd: desiredRegistrationEnd,
      })
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!formData.name.trim()) {
      setError('Tournament name is required')
      return
    }

    if (!formData.gameId.trim()) {
      setError('Game is required')
      return
    }

    if (formData.maxTeams < 2) {
      setError('At least 2 teams are required')
      return
    }

    if (!formData.startDate) {
      setError('Start date is required')
      return
    }

    if (!formData.registrationStart) {
      setError('Registration start date is required')
      return
    }

    if (!formData.registrationEnd) {
      setError('Registration end date is required')
      return
    }

    const data = {
      name: formData.name,
      description: formData.description || undefined,
      gameId: formData.gameId,
      format: formData.format as 'SINGLE_ELIMINATION' | 'DOUBLE_ELIMINATION' | 'ROUND_ROBIN' | 'SWISS',
      maxTeams: formData.maxTeams,
      startDate: formData.startDate!,
      endDate: formData.endDate || undefined,
      registrationStart: formData.registrationStart!,
      registrationEnd: formData.registrationEnd!,
      rules: formData.rules || undefined,
      prizePool: formData.prizePool || undefined,
      banner: formData.banner || undefined,
    }

    if (mode === 'edit' && tournament?.id) {
      updateMutation.mutate({ id: tournament.id, ...data })
    } else {
      createMutation.mutate(data)
    }
  }

  const isLoading = createMutation.isPending || updateMutation.isPending

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Trophy className='h-5 w-5 text-primary' />
            {mode === 'create' ? 'Create Tournament' : 'Edit Tournament'}
          </CardTitle>
          <CardDescription>
            {mode === 'create'
              ? 'Set up a new tournament with custom settings'
              : 'Update tournament details'}
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-6'>
          {error && (
            <Alert variant='destructive'>
              <AlertCircle className='h-4 w-4' />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <TournamentFormCoreFields
            formData={formData}
            setFormData={setFormData}
            games={games}
            gamesLoading={gamesLoading}
          />

          <TournamentFormRegistration
            mode={mode}
            formData={formData}
            setFormData={setFormData}
            tournament={tournament}
            effectiveStatus={effectiveStatus}
            isRegistrationPhaseOpen={isRegistrationPhaseOpen}
            isTogglingRegistration={isTogglingRegistration}
            onToggleRegistration={handleToggleRegistration}
          />

          <TournamentFormSchedule formData={formData} setFormData={setFormData} />

          <TournamentFormExtras formData={formData} setFormData={setFormData} />

          <div className='flex gap-4 pt-4'>
            <Button type='submit' className='gradient-purple glow-purple-hover flex-1' disabled={isLoading}>
              {isLoading && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
              {mode === 'create' ? 'Create Tournament' : 'Save Changes'}
            </Button>
            <Button type='button' variant='outline' onClick={() => router.back()} disabled={isLoading}>
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  )
}
