'use client'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Loader2 } from 'lucide-react'
import type { ActionDialogState } from './types'

type RegistrationActionDialogProps = {
  actionDialog: ActionDialogState
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  isPending: boolean
}

export function RegistrationActionDialog({
  actionDialog,
  onOpenChange,
  onConfirm,
  isPending,
}: RegistrationActionDialogProps) {
  return (
    <AlertDialog open={actionDialog.open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {actionDialog.type === 'approve' ? 'Approve' : 'Reject'} Registration
          </AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to {actionDialog.type} the registration for{' '}
            <span className='font-semibold'>{actionDialog.teamName}</span>?
            {actionDialog.type === 'reject' && ' This action can be undone later.'}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isPending}
            className={actionDialog.type === 'reject' ? 'bg-destructive hover:bg-destructive/90' : ''}
          >
            {isPending && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
            {actionDialog.type === 'approve' ? 'Approve' : 'Reject'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
