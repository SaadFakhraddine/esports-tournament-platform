'use client'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { DateTimePicker } from '@/components/ui/date-time-picker'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Loader2, Lock, LockOpen, Info } from 'lucide-react'
import type { TournamentFormState, TournamentFormTournament } from './types'

interface TournamentFormRegistrationProps {
  mode: 'create' | 'edit'
  formData: TournamentFormState
  setFormData: React.Dispatch<React.SetStateAction<TournamentFormState>>
  tournament: TournamentFormTournament | undefined
  effectiveStatus: string | undefined
  isRegistrationPhaseOpen: boolean
  isTogglingRegistration: boolean
  onToggleRegistration: () => void
}

export function TournamentFormRegistration({
  mode,
  formData,
  setFormData,
  tournament,
  effectiveStatus,
  isRegistrationPhaseOpen,
  isTogglingRegistration,
  onToggleRegistration,
}: TournamentFormRegistrationProps) {
  return (
    <div className='space-y-2'>
      <div className='flex items-center justify-between'>
        <div>
          <Label className='text-base font-semibold'>Registration Period</Label>
          <p className='text-sm text-muted-foreground mt-1'>Set when teams can register for your tournament</p>
        </div>
        {mode === 'edit' && tournament?.id && (
          <div className='flex items-center gap-2'>
            <Badge
              variant='outline'
              className={
                effectiveStatus === 'REGISTRATION'
                  ? 'bg-green-500/10 text-green-500 border-green-500/20'
                  : 'bg-gray-500/10 text-gray-500 border-gray-500/20'
              }
            >
              {effectiveStatus === 'REGISTRATION' ? 'Open' : 'Closed'}
            </Badge>
            <Button
              type='button'
              size='sm'
              variant={effectiveStatus === 'REGISTRATION' ? 'destructive' : 'default'}
              className={effectiveStatus === 'REGISTRATION' ? '' : 'gradient-purple'}
              onClick={onToggleRegistration}
              disabled={
                isTogglingRegistration ||
                tournament?.status === 'COMPLETED' ||
                tournament?.status === 'CANCELLED' ||
                (!isRegistrationPhaseOpen && tournament?.status !== 'DRAFT')
              }
            >
              {isTogglingRegistration ? (
                <Loader2 className='h-4 w-4 mr-2 animate-spin' />
              ) : effectiveStatus === 'REGISTRATION' ? (
                <Lock className='h-4 w-4 mr-2' />
              ) : (
                <LockOpen className='h-4 w-4 mr-2' />
              )}
              {effectiveStatus === 'REGISTRATION' ? 'Close' : 'Open'}
            </Button>
          </div>
        )}
      </div>
      <div className='grid gap-4 sm:grid-cols-2 mt-4'>
        <div className='space-y-2'>
          <Label
            htmlFor='registrationStart'
            className={mode === 'edit' && tournament?.status !== 'REGISTRATION' ? 'text-muted-foreground' : ''}
          >
            Registration Start *
          </Label>
          <DateTimePicker
            selected={formData.registrationStart}
            onChange={(date) => setFormData({ ...formData, registrationStart: date })}
            placeholderText='Select start date and time'
            minDate={new Date()}
            required
            disabled={mode === 'edit' && effectiveStatus !== 'REGISTRATION'}
          />
        </div>

        <div className='space-y-2'>
          <Label
            htmlFor='registrationEnd'
            className={mode === 'edit' && tournament?.status !== 'REGISTRATION' ? 'text-muted-foreground' : ''}
          >
            Registration End *
          </Label>
          <DateTimePicker
            selected={formData.registrationEnd}
            onChange={(date) => setFormData({ ...formData, registrationEnd: date })}
            placeholderText='Select end date and time'
            minDate={formData.registrationStart || new Date()}
            required
            disabled={mode === 'edit' && effectiveStatus !== 'REGISTRATION'}
          />
        </div>
      </div>
      {mode === 'edit' && effectiveStatus === 'REGISTRATION' && (
        <Alert className='mt-2'>
          <Info className='h-4 w-4' />
          <AlertDescription className='text-sm'>
            Registration is currently open. Teams can register. Click &quot;Close&quot; to manually lock registration.
          </AlertDescription>
        </Alert>
      )}
      {mode === 'edit' && tournament?.status === 'DRAFT' && (
        <Alert className='mt-2'>
          <Info className='h-4 w-4' />
          <AlertDescription className='text-sm'>
            Tournament is in draft. Click &quot;Open&quot; to open registration and allow teams to sign up.
          </AlertDescription>
        </Alert>
      )}
      {mode === 'edit' &&
        (tournament?.status === 'SEEDING' ||
          tournament?.status === 'IN_PROGRESS' ||
          tournament?.status === 'COMPLETED' ||
          tournament?.status === 'CANCELLED') && (
          <Alert className='mt-2'>
            <Info className='h-4 w-4' />
            <AlertDescription className='text-sm'>
              Registration cannot be reopened after the tournament has left the registration phase. To add teams,
              create a new tournament.
            </AlertDescription>
          </Alert>
        )}
    </div>
  )
}
