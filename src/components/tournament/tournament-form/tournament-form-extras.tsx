'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { TournamentFormState } from './types'

interface TournamentFormExtrasProps {
  formData: TournamentFormState
  setFormData: React.Dispatch<React.SetStateAction<TournamentFormState>>
}

export function TournamentFormExtras({ formData, setFormData }: TournamentFormExtrasProps) {
  return (
    <div className='space-y-4'>
      <Label className='text-base font-semibold'>Additional Details</Label>

      <div className='space-y-2'>
        <Label htmlFor='rules'>Tournament Rules</Label>
        <Textarea
          id='rules'
          placeholder='List tournament rules, regulations, and guidelines...'
          value={formData.rules}
          onChange={(e) => setFormData({ ...formData, rules: e.target.value })}
          rows={4}
        />
      </div>

      <div className='space-y-2'>
        <Label htmlFor='prizePool'>Prize Pool</Label>
        <Input
          id='prizePool'
          placeholder='e.g., $10,000 USD, 1st: $5000, 2nd: $3000, 3rd: $2000'
          value={formData.prizePool}
          onChange={(e) => setFormData({ ...formData, prizePool: e.target.value })}
        />
      </div>

      <div className='space-y-2'>
        <Label htmlFor='banner'>Banner Image URL</Label>
        <Input
          id='banner'
          type='url'
          placeholder='https://example.com/banner.jpg'
          value={formData.banner}
          onChange={(e) => setFormData({ ...formData, banner: e.target.value })}
        />
        <p className='text-xs text-muted-foreground'>Recommended size: 1920x1080px</p>
      </div>
    </div>
  )
}
