'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { redirect, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { trpc } from '@/lib/trpc/client'
import { Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export default function CreateTeamPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const createTeamMutation = trpc.team.create.useMutation()
  const { data: games, isLoading: gamesLoading } = trpc.game.getAll.useQuery()

  const [formData, setFormData] = useState({
    name: '',
    tag: '',
    logo: '',
    description: '',
    gameId: '',
  })

  if (status === 'loading') {
    return <div>Loading...</div>
  }

  if (!session) {
    redirect('/login')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    if (!formData.gameId.trim()) {
      toast({
        title: 'Game required',
        description: 'Select which game this team competes in.',
        variant: 'destructive',
      })
      setIsSubmitting(false)
      return
    }

    try {
      const team = await createTeamMutation.mutateAsync({
        name: formData.name,
        tag: formData.tag || undefined,
        logo: formData.logo || undefined,
        description: formData.description || undefined,
        game: formData.gameId,
      })

      toast({
        title: 'Success!',
        description: 'Team created successfully',
      })

      router.push(`/teams/${team.id}`)
    } catch (error: unknown) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create team',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className='max-w-3xl mx-auto space-y-6'>
      {/* Header */}
      <div>
        <h1 className='text-3xl font-bold tracking-tight'>Create Team</h1>
        <p className='text-muted-foreground mt-2'>Start your competitive journey by creating a new team</p>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>Team Information</CardTitle>
          <CardDescription>Fill in the details to create your team</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className='space-y-6'>
            {/* Team Name */}
            <div className='space-y-2'>
              <Label htmlFor='name'>
                Team Name <span className='text-destructive'>*</span>
              </Label>
              <Input
                id='name'
                placeholder='e.g., Phoenix Legends'
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            {/* Team Tag */}
            <div className='space-y-2'>
              <Label htmlFor='tag'>Team Tag</Label>
              <Input
                id='tag'
                placeholder='e.g., PHX'
                value={formData.tag}
                onChange={(e) => setFormData({ ...formData, tag: e.target.value })}
                maxLength={5}
              />
              <p className='text-sm text-muted-foreground'>Short tag for your team (optional)</p>
            </div>

            {/* Game Selection */}
            <div className='space-y-2'>
              <Label htmlFor='game'>
                Game <span className='text-destructive'>*</span>
              </Label>
              <Select
                value={formData.gameId}
                onValueChange={(value) => setFormData({ ...formData, gameId: value })}
                disabled={gamesLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder={gamesLoading ? 'Loading games...' : 'Select a game'} />
                </SelectTrigger>
                <SelectContent>
                  {(games ?? []).map((game) => (
                    <SelectItem key={game.id} value={game.id}>
                      {game.icon} {game.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Logo URL */}
            <div className='space-y-2'>
              <Label htmlFor='logo'>Logo URL</Label>
              <Input
                id='logo'
                placeholder='https://...'
                value={formData.logo}
                onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
              />
            </div>

            {/* Description */}
            <div className='space-y-2'>
              <Label htmlFor='description'>Description</Label>
              <Textarea
                id='description'
                placeholder='Tell us about your team...'
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
              />
            </div>

            {/* Submit */}
            <Button type='submit' className='w-full' disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  Creating...
                </>
              ) : (
                'Create Team'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

