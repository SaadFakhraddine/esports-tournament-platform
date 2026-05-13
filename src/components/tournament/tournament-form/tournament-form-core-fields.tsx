'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { TournamentFormState } from './types'

type GameRow = { id: string; name: string; icon: string | null }

interface TournamentFormCoreFieldsProps {
  formData: TournamentFormState
  setFormData: React.Dispatch<React.SetStateAction<TournamentFormState>>
  games: GameRow[] | undefined
  gamesLoading: boolean
}

export function TournamentFormCoreFields({
  formData,
  setFormData,
  games,
  gamesLoading,
}: TournamentFormCoreFieldsProps) {
  return (
    <>
      <div className='space-y-4'>
        <div className='space-y-2'>
          <Label htmlFor='name'>Tournament Name *</Label>
          <Input
            id='name'
            placeholder='Summer Championship 2026'
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>

        <div className='space-y-2'>
          <Label htmlFor='description'>Description</Label>
          <Textarea
            id='description'
            placeholder='Describe your tournament...'
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
          />
        </div>
      </div>

      <div className='grid gap-4 sm:grid-cols-2'>
        <div className='space-y-2'>
          <Label htmlFor='game'>Game *</Label>
          <Select
            value={formData.gameId}
            onValueChange={(value) => setFormData({ ...formData, gameId: value })}
            disabled={gamesLoading}
          >
            <SelectTrigger id='game'>
              <SelectValue placeholder={gamesLoading ? 'Loading games...' : 'Select a game'} />
            </SelectTrigger>
            <SelectContent>
              {games?.map((game) => (
                <SelectItem key={game.id} value={game.id}>
                  {game.icon && <span className='mr-2'>{game.icon}</span>}
                  {game.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className='text-xs text-muted-foreground'>Don&apos;t see your game? Contact an admin to add it.</p>
        </div>

        <div className='space-y-2'>
          <Label htmlFor='format'>Tournament Format *</Label>
          <Select
            value={formData.format}
            onValueChange={(value) => setFormData({ ...formData, format: value })}
          >
            <SelectTrigger id='format'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='SINGLE_ELIMINATION'>Single Elimination</SelectItem>
              <SelectItem value='DOUBLE_ELIMINATION'>Double Elimination</SelectItem>
              <SelectItem value='ROUND_ROBIN'>Round Robin</SelectItem>
              <SelectItem value='SWISS'>Swiss</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className='space-y-2'>
        <Label htmlFor='maxTeams'>Max Teams *</Label>
        <Input
          id='maxTeams'
          type='number'
          min='2'
          max='128'
          value={formData.maxTeams}
          onChange={(e) =>
            setFormData({
              ...formData,
              maxTeams: parseInt(e.target.value) || 0,
            })
          }
          required
        />
        <p className='text-xs text-muted-foreground'>
          Power of 2 recommended for single/double elimination (4, 8, 16, 32...)
        </p>
      </div>
    </>
  )
}
