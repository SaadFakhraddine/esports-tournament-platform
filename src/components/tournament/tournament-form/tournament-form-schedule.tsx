'use client'

import { Label } from '@/components/ui/label'
import { DateTimePicker } from '@/components/ui/date-time-picker'
import type { TournamentFormState } from './types'

interface TournamentFormScheduleProps {
  formData: TournamentFormState
  setFormData: React.Dispatch<React.SetStateAction<TournamentFormState>>
}

export function TournamentFormSchedule({ formData, setFormData }: TournamentFormScheduleProps) {
  return (
    <div className='space-y-2'>
      <Label className='text-base font-semibold'>Tournament Schedule</Label>
      <p className='text-sm text-muted-foreground mb-2'>Set when the tournament will take place</p>
      <div className='grid gap-4 sm:grid-cols-2'>
        <div className='space-y-2'>
          <Label htmlFor='startDate'>Start Date & Time *</Label>
          <DateTimePicker
            selected={formData.startDate}
            onChange={(date) => setFormData({ ...formData, startDate: date })}
            placeholderText='Select tournament start'
            minDate={formData.registrationEnd || new Date()}
            required
          />
        </div>

        <div className='space-y-2'>
          <Label htmlFor='endDate'>End Date & Time (Optional)</Label>
          <DateTimePicker
            selected={formData.endDate}
            onChange={(date) => setFormData({ ...formData, endDate: date })}
            placeholderText='Select tournament end'
            minDate={formData.startDate || new Date()}
          />
        </div>
      </div>
    </div>
  )
}
