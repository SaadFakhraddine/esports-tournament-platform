'use client'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DateTimePicker } from '@/components/ui/date-time-picker'

export function TournamentManageDialogs({
  reportOpen,
  setReportOpen,
  reportHomeScore,
  setReportHomeScore,
  reportAwayScore,
  setReportAwayScore,
  submitReportedResult,
  submitResultMutation,
  reportMatchId,
  scheduleOpen,
  onScheduleDialogOpenChange,
  scheduleHadTime,
  scheduleAt,
  setScheduleAt,
  scheduleMatchId,
  saveMatchSchedule,
  setScheduleMutation,
}: {
  reportOpen: boolean
  setReportOpen: (open: boolean) => void
  reportHomeScore: string
  setReportHomeScore: (v: string) => void
  reportAwayScore: string
  setReportAwayScore: (v: string) => void
  submitReportedResult: () => void | Promise<void>
  submitResultMutation: { isPending: boolean }
  reportMatchId: string | null
  scheduleOpen: boolean
  onScheduleDialogOpenChange: (open: boolean) => void
  scheduleHadTime: boolean
  scheduleAt: Date | null
  setScheduleAt: (d: Date | null) => void
  scheduleMatchId: string | null
  saveMatchSchedule: () => void | Promise<void>
  setScheduleMutation: {
    isPending: boolean
    mutateAsync: (input: { matchId: string; scheduledAt: Date | null }) => Promise<unknown>
  }
}) {
  return (
    <>
      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report Match Result</DialogTitle>
          </DialogHeader>

          <div className='grid gap-4'>
            <div className='grid grid-cols-2 gap-3'>
              <div className='space-y-2'>
                <p className='text-sm text-muted-foreground'>Home Score</p>
                <Input
                  type='number'
                  min={0}
                  value={reportHomeScore}
                  onChange={(e) => setReportHomeScore(e.target.value)}
                />
              </div>
              <div className='space-y-2'>
                <p className='text-sm text-muted-foreground'>Away Score</p>
                <Input
                  type='number'
                  min={0}
                  value={reportAwayScore}
                  onChange={(e) => setReportAwayScore(e.target.value)}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setReportOpen(false)}
              disabled={submitResultMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={() => void submitReportedResult()}
              disabled={submitResultMutation.isPending || !reportMatchId}
            >
              {submitResultMutation.isPending ? 'Submitting...' : 'Submit'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={scheduleOpen} onOpenChange={onScheduleDialogOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{scheduleHadTime ? 'Edit match time' : 'Schedule match'}</DialogTitle>
          </DialogHeader>

          <div className='space-y-2'>
            <Label>Date &amp; time</Label>
            <DateTimePicker
              selected={scheduleAt}
              onChange={setScheduleAt}
              placeholderText='Pick date and time'
            />
          </div>

          <DialogFooter className='flex flex-col-reverse gap-2 sm:flex-row sm:justify-between sm:gap-0'>
            <div className='flex flex-wrap gap-2 sm:mr-auto'>
              {scheduleHadTime && (
                <Button
                  type='button'
                  variant='outline'
                  disabled={setScheduleMutation.isPending}
                  onClick={async () => {
                    if (!scheduleMatchId) return
                    if (!confirm('Remove the scheduled time for this match?')) return
                    try {
                      await setScheduleMutation.mutateAsync({
                        matchId: scheduleMatchId,
                        scheduledAt: null,
                      })
                    } catch (error: unknown) {
                      alert(error instanceof Error ? error.message : 'Failed to clear schedule')
                    }
                  }}
                >
                  Clear time
                </Button>
              )}
            </div>
            <div className='flex flex-wrap justify-end gap-2'>
              <Button
                type='button'
                variant='outline'
                onClick={() => onScheduleDialogOpenChange(false)}
                disabled={setScheduleMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type='button'
                onClick={() => void saveMatchSchedule()}
                disabled={setScheduleMutation.isPending || !scheduleAt}
              >
                {setScheduleMutation.isPending ? 'Saving…' : 'Save'}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
