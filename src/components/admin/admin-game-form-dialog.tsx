'use client'

import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { slugifyGameName } from '@/lib/admin/slug'

export type GameFormValues = {
  name: string
  slug: string
  description: string
  active: boolean
}

type AdminGameFormDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: 'create' | 'edit'
  initial?: Partial<GameFormValues>
  isPending?: boolean
  onSubmit: (values: GameFormValues) => void
}

const emptyForm: GameFormValues = {
  name: '',
  slug: '',
  description: '',
  active: true,
}

export function AdminGameFormDialog({
  open,
  onOpenChange,
  mode,
  initial,
  isPending,
  onSubmit,
}: AdminGameFormDialogProps) {
  const [form, setForm] = useState<GameFormValues>(emptyForm)
  const [slugTouched, setSlugTouched] = useState(false)

  useEffect(() => {
    if (open) {
      setForm({
        name: initial?.name ?? '',
        slug: initial?.slug ?? '',
        description: initial?.description ?? '',
        active: initial?.active ?? true,
      })
      setSlugTouched(!!initial?.slug)
    }
  }, [open, initial])

  const handleNameChange = (name: string) => {
    setForm((prev) => ({
      ...prev,
      name,
      slug: !slugTouched && mode === 'create' ? slugifyGameName(name) : prev.slug,
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(form)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? 'Add game' : 'Edit game'}</DialogTitle>
          <DialogDescription>
            Games appear in tournament and team creation forms when active.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className='space-y-4'>
          <div className='space-y-2'>
            <Label htmlFor='game-name'>Name</Label>
            <Input
              id='game-name'
              value={form.name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder='Valorant'
              required
            />
          </div>
          <div className='space-y-2'>
            <Label htmlFor='game-slug'>Slug</Label>
            <Input
              id='game-slug'
              value={form.slug}
              onChange={(e) => {
                setSlugTouched(true)
                setForm((prev) => ({ ...prev, slug: e.target.value }))
              }}
              placeholder='valorant'
            />
          </div>
          <div className='space-y-2'>
            <Label htmlFor='game-desc'>Description</Label>
            <Textarea
              id='game-desc'
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              rows={2}
            />
          </div>
          <div className='flex items-center gap-2'>
            <input
              id='game-active'
              type='checkbox'
              checked={form.active}
              onChange={(e) => setForm((prev) => ({ ...prev, active: e.target.checked }))}
              className='h-4 w-4 rounded border-input'
            />
            <Label htmlFor='game-active'>Active (visible in forms)</Label>
          </div>
          <DialogFooter>
            <Button type='button' variant='outline' onClick={() => onOpenChange(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button type='submit' disabled={isPending}>
              {mode === 'create' ? 'Add game' : 'Save changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
