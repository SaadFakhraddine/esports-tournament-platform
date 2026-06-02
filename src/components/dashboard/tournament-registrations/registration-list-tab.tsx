'use client'

import { format } from 'date-fns'
import { Check, X, Clock, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import type { RegistrationType } from './types'

function RegistrationCard({
  registration,
  onApprove,
  onReject,
}: {
  registration: RegistrationType
  onApprove?: () => void
  onReject?: () => void
}) {
  return (
    <div className='flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors'>
      <div className='flex items-center gap-4'>
        {registration.seed && (
          <div className='flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 border-2 border-primary/20 font-bold text-primary'>
            {registration.seed}
          </div>
        )}
        <Avatar className='h-12 w-12'>
          <AvatarImage src={registration.team.logo || undefined} />
          <AvatarFallback>{registration.team.name.charAt(0)}</AvatarFallback>
        </Avatar>
        <div>
          <div className='flex items-center gap-2'>
            <p className='font-medium'>{registration.team.name}</p>
            {!registration.seed && registration.status === 'APPROVED' && (
              <Badge variant='outline' className='text-xs'>
                Not seeded
              </Badge>
            )}
          </div>
          {registration.team.tag && (
            <p className='text-sm text-muted-foreground'>[{registration.team.tag}]</p>
          )}
          <p className='text-xs text-muted-foreground'>
            Registered {format(new Date(registration.registeredAt), 'MMM d, yyyy')}
          </p>
        </div>
      </div>
      <div className='flex items-center gap-2'>
        <Badge
          variant='outline'
          className={
            registration.status === 'PENDING'
              ? 'bg-yellow-500/10 text-yellow-500'
              : registration.status === 'APPROVED'
                ? 'bg-green-500/10 text-green-500'
                : 'bg-red-500/10 text-red-500'
          }
        >
          {registration.status}
        </Badge>
        {onApprove && onReject && (
          <div className='flex gap-2'>
            <Button
              size='sm'
              variant='outline'
              className='text-green-500 hover:bg-green-500/10'
              onClick={onApprove}
            >
              <Check className='h-4 w-4' />
            </Button>
            <Button
              size='sm'
              variant='outline'
              className='text-red-500 hover:bg-red-500/10'
              onClick={onReject}
            >
              <X className='h-4 w-4' />
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

function RegistrationList({
  registrations,
  isLoading,
}: {
  registrations: RegistrationType[]
  isLoading: boolean
}) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className='pt-6'>
          <div className='space-y-4'>
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className='h-20 w-full' />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (registrations.length === 0) {
    return (
      <Card>
        <CardContent className='pt-6'>
          <div className='text-center py-8 text-muted-foreground'>
            <Users className='h-12 w-12 mx-auto mb-2 opacity-50' />
            <p>No registrations found</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className='pt-6'>
        <div className='space-y-4'>
          {registrations.map((registration) => (
            <RegistrationCard key={registration.id} registration={registration} />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

type PendingTabProps = {
  registrations: RegistrationType[]
  isLoading: boolean
  onApprove: (registration: RegistrationType) => void
  onReject: (registration: RegistrationType) => void
}

export function PendingRegistrationsTab({
  registrations,
  isLoading,
  onApprove,
  onReject,
}: PendingTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Pending Approval</CardTitle>
        <CardDescription>Review and approve or reject team registrations</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className='space-y-4'>
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className='h-20 w-full' />
            ))}
          </div>
        ) : registrations.length === 0 ? (
          <div className='text-center py-8 text-muted-foreground'>
            <Clock className='h-12 w-12 mx-auto mb-2 opacity-50' />
            <p>No pending registrations</p>
          </div>
        ) : (
          <div className='space-y-4'>
            {registrations.map((registration) => (
              <RegistrationCard
                key={registration.id}
                registration={registration}
                onApprove={() => onApprove(registration)}
                onReject={() => onReject(registration)}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

type ListTabProps = {
  registrations: RegistrationType[]
  isLoading: boolean
}

export function RegistrationListTab({ registrations, isLoading }: ListTabProps) {
  return <RegistrationList registrations={registrations} isLoading={isLoading} />
}
