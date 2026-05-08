'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { redirect, useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { trpc } from '@/lib/trpc/client'
import { Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export default function EditTeamPage() {
  const { data: session, status } = useSession()
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const teamId = params.id as string

  const { data: team, isLoading } = trpc.team.getOverviewById.useQuery({ id: teamId }, { enabled: !!teamId })

  const updateTeamMutation = trpc.team.update.useMutation()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    tag: '',
    logo: '',
    description: '',
  })

  useEffect(() => {
    if (team) {
      setFormData({
        name: team.name,
        tag: team.tag || '',
        logo: team.logo || '',
        description: team.description || '',
      })
    }
  }, [team])

  if (status === 'loading' || isLoading) {
    return (
      <div className='max-w-3xl mx-auto space-y-6'>
        <Skeleton className='h-12 w-64' />
        <Skeleton className='h-96' />
      </div>
    )
  }

  if (!session) {
    redirect('/login')
  }

  if (!team) {
    return (
      <div className='text-center py-12'>
        <p className='text-lg font-medium'>Team not found</p>
      </div>
    )
  }

  // Check if user is the team owner
  if (team.owner.id !== session.user.id) {
    return (
      <div className='text-center py-12'>
        <p className='text-lg font-medium'>You don&apos;t have permission to edit this team</p>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      await updateTeamMutation.mutateAsync({
        id: teamId,
        name: formData.name !== team.name ? formData.name : undefined,
        tag: formData.tag !== team.tag ? (formData.tag || undefined) : undefined,
        logo: formData.logo !== team.logo ? (formData.logo || undefined) : undefined,
        description: formData.description !== team.description ? (formData.description || undefined) : undefined,
      })

      toast({
        title: 'Success!',
        description: 'Team updated successfully',
      })

      router.push(`/teams/${teamId}`)
    } catch (error: unknown) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update team',
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
        <h1 className='text-3xl font-bold tracking-tight'>Edit Team</h1>
        <p className='text-muted-foreground mt-2'>Update your team information</p>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>Team Information</CardTitle>
          <CardDescription>Update the details for your team</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className='space-y-6'>
            {/* Team Name */}
            <div className='space-y-2'>
              <Label htmlFor='name'>Team Name</Label>
              <Input
                id='name'
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
                value={formData.tag}
                onChange={(e) => setFormData({ ...formData, tag: e.target.value })}
                maxLength={5}
              />
            </div>

            {/* Logo URL */}
            <div className='space-y-2'>
              <Label htmlFor='logo'>Logo URL</Label>
              <Input
                id='logo'
                value={formData.logo}
                onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
              />
            </div>

            {/* Description */}
            <div className='space-y-2'>
              <Label htmlFor='description'>Description</Label>
              <Textarea
                id='description'
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
              />
            </div>

            <div className='flex gap-2'>
              <Button type='submit' disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
              <Button type='button' variant='outline' onClick={() => router.push(`/teams/${teamId}`)}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

