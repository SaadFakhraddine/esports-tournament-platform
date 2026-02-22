'use client'

import { useState } from 'react'
import Link from 'next/link'
import { trpc } from '@/lib/trpc/client'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { UserPlus, Loader2, AlertCircle, CheckCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface RegisterTeamDialogProps {
  tournamentId: string
  tournamentName: string
  isAdmin?: boolean
}

export function RegisterTeamDialog({
  tournamentId,
  tournamentName,
  isAdmin = false,
}: RegisterTeamDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [selectedTeamId, setSelectedTeamId] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const { data: myTeams, isLoading: teamsLoading } = trpc.team.getMyTeams.useQuery(
    undefined,
    { enabled: open }
  )

  const registerMutation = trpc.tournament.register.useMutation({
    onSuccess: () => {
      setSuccess(true)
      setError(null)
      setTimeout(() => {
        setOpen(false)
        setSuccess(false)
        setSelectedTeamId('')
        router.refresh()
      }, 2000)
    },
    onError: (err) => {
      setError(err.message)
      setSuccess(false)
    },
  })

  const handleRegister = () => {
    if (!selectedTeamId) {
      setError('Please select a team')
      return
    }

    setError(null)
    registerMutation.mutate({
      tournamentId,
      teamId: selectedTeamId,
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className='w-full gradient-purple gap-2'>
          <UserPlus className='h-4 w-4' />
          Register a Team
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Register a Team</DialogTitle>
          <DialogDescription>
            Register one of your teams for {tournamentName}
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4 py-4'>
          {success ? (
            <Alert className='border-green-500/50 bg-green-500/10'>
              <CheckCircle className='h-4 w-4 text-green-500' />
              <AlertDescription className='text-green-500'>
                {isAdmin
                  ? 'Team registered and approved successfully!'
                  : 'Registration submitted! Waiting for organizer approval.'}
              </AlertDescription>
            </Alert>
          ) : (
            <>
              <div className='space-y-2'>
                <Label htmlFor='team'>Select Team</Label>
                {teamsLoading ? (
                  <div className='flex items-center justify-center py-4'>
                    <Loader2 className='h-6 w-6 animate-spin text-muted-foreground' />
                  </div>
                ) : myTeams && myTeams.length > 0 ? (
                  <Select value={selectedTeamId} onValueChange={setSelectedTeamId}>
                    <SelectTrigger>
                      <SelectValue placeholder='Choose a team' />
                    </SelectTrigger>
                    <SelectContent>
                      {myTeams.map((team) => (
                        <SelectItem key={team.id} value={team.id}>
                          <div className='flex items-center gap-2'>
                            <span className='font-medium'>{team.name}</span>
                            {team.tag && (
                              <span className='text-muted-foreground'>
                                [{team.tag}]
                              </span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Alert>
                    <AlertCircle className='h-4 w-4' />
                    <AlertDescription>
                      You don&apos;t have any teams yet.{' '}
                      <Link href='/teams/create' className='underline font-medium'>
                        Create a team
                      </Link>{' '}
                      to register.
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              {error && (
                <Alert variant='destructive'>
                  <AlertCircle className='h-4 w-4' />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className='flex gap-3 justify-end'>
                <Button
                  variant='outline'
                  onClick={() => setOpen(false)}
                  disabled={registerMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleRegister}
                  disabled={registerMutation.isPending || !selectedTeamId}
                  className='gradient-purple'
                >
                  {registerMutation.isPending ? (
                    <>
                      <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                      Registering...
                    </>
                  ) : (
                    'Register a Team'
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
