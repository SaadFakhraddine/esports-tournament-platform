'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { redirect, useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { trpc } from '@/lib/trpc/client'
import { Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export default function CreateTeamPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const createTeamMutation = trpc.team.create.useMutation()

  const [formData, setFormData] = useState({
    name: '',
    tag: '',
    logo: '',
    description: '',
    game: '',
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

    try {
      const team = await createTeamMutation.mutateAsync({
        name: formData.name,
        tag: formData.tag || undefined,
        logo: formData.logo || undefined,
        description: formData.description || undefined,
        game: formData.game,
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
    <DashboardLayout userRole={session.user.role}>
      <div className='max-w-3xl mx-auto space-y-6'>
        {/* Header */}
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>Create Team</h1>
          <p className='text-muted-foreground mt-2'>
            Start your competitive journey by creating a new team
          </p>
        </div>

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle>Team Information</CardTitle>
            <CardDescription>
              Fill in the details to create your team
            </CardDescription>
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
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                  minLength={3}
                  maxLength={50}
                />
                <p className='text-xs text-muted-foreground'>
                  Choose a unique name for your team (3-50 characters)
                </p>
              </div>

              {/* Team Tag */}
              <div className='space-y-2'>
                <Label htmlFor='tag'>Team Tag (Optional)</Label>
                <Input
                  id='tag'
                  placeholder='e.g., PHX'
                  value={formData.tag}
                  onChange={(e) =>
                    setFormData({ ...formData, tag: e.target.value.toUpperCase() })
                  }
                  maxLength={10}
                />
                <p className='text-xs text-muted-foreground'>
                  A short abbreviation for your team (2-10 characters)
                </p>
              </div>

              {/* Game */}
              <div className='space-y-2'>
                <Label htmlFor='game'>
                  Game <span className='text-destructive'>*</span>
                </Label>
                <Input
                  id='game'
                  placeholder='e.g., Valorant, League of Legends, CS:GO'
                  value={formData.game}
                  onChange={(e) =>
                    setFormData({ ...formData, game: e.target.value })
                  }
                  required
                  minLength={2}
                />
                <p className='text-xs text-muted-foreground'>
                  Which game will your team compete in?
                </p>
              </div>

              {/* Logo URL */}
              <div className='space-y-2'>
                <Label htmlFor='logo'>Logo URL (Optional)</Label>
                <Input
                  id='logo'
                  type='url'
                  placeholder='https://example.com/logo.png'
                  value={formData.logo}
                  onChange={(e) =>
                    setFormData({ ...formData, logo: e.target.value })
                  }
                />
                <p className='text-xs text-muted-foreground'>
                  Direct link to your team&apos;s logo image
                </p>
              </div>

              {/* Description */}
              <div className='space-y-2'>
                <Label htmlFor='description'>Description (Optional)</Label>
                <Textarea
                  id='description'
                  placeholder='Tell us about your team...'
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={4}
                  maxLength={500}
                />
                <p className='text-xs text-muted-foreground'>
                  {formData.description.length}/500 characters
                </p>
              </div>

              {/* Submit Buttons */}
              <div className='flex gap-4'>
                <Button
                  type='submit'
                  disabled={isSubmitting}
                  className='flex-1'
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                      Creating...
                    </>
                  ) : (
                    'Create Team'
                  )}
                </Button>
                <Button
                  type='button'
                  variant='outline'
                  onClick={() => router.back()}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
