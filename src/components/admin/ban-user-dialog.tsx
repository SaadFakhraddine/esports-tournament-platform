'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

type BanUserDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  userEmail: string
  onConfirm: (reason: string) => void
  isPending?: boolean
}

export function BanUserDialog({
  open,
  onOpenChange,
  userEmail,
  onConfirm,
  isPending,
}: BanUserDialogProps) {
  const [reason, setReason] = useState('')

  const handleConfirm = () => {
    onConfirm(reason)
    setReason('')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Suspend account</DialogTitle>
          <DialogDescription>
            This will block <span className='font-medium'>{userEmail}</span> from signing in.
          </DialogDescription>
        </DialogHeader>
        <div className='space-y-2'>
          <Label htmlFor='ban-reason'>Reason (optional)</Label>
          <Textarea
            id='ban-reason'
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
          />
        </div>
        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button variant='destructive' onClick={handleConfirm} disabled={isPending}>
            Suspend account
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
