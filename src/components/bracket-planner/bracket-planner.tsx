'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { TournamentFormat } from '@prisma/client'
import { trpc } from '@/lib/trpc/client'
import { BracketView } from '@/components/bracket/bracket-view'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { FORMAT_LABELS } from '@/lib/bracket-planner/recommend-format'
import type { PlannerConstraints, TournamentFormatId } from '@/lib/bracket-planner/types'
import { Loader2, Sparkles, ArrowRight, CheckCircle2 } from 'lucide-react'

const FORMAT_OPTIONS: { value: TournamentFormatId; label: string }[] = [
  { value: 'SINGLE_ELIMINATION', label: 'Single Elimination' },
  { value: 'DOUBLE_ELIMINATION', label: 'Double Elimination' },
  { value: 'ROUND_ROBIN', label: 'Round Robin' },
  { value: 'SWISS', label: 'Swiss' },
]

export function BracketPlanner() {
  const router = useRouter()
  const [teamCount, setTeamCount] = useState(8)
  const [constraints, setConstraints] = useState<PlannerConstraints>({
    schedule: 'multi_day',
    playStyle: 'balanced',
  })
  const [selectedFormat, setSelectedFormat] = useState<TournamentFormatId>('SINGLE_ELIMINATION')

  const teamCountValid = teamCount >= 2 && teamCount <= 128

  const recommendQuery = trpc.tournament.recommend.useQuery(
    { teamCount, constraints },
    { enabled: teamCountValid },
  )

  const previewQuery = trpc.tournament.preview.useQuery(
    {
      teamCount,
      format: selectedFormat as TournamentFormat,
    },
    { enabled: teamCountValid },
  )

  const recommendations = recommendQuery.data?.recommendations ?? []

  useEffect(() => {
    const primary = recommendQuery.data?.primary.format
    if (primary) {
      setSelectedFormat(primary)
    }
  }, [teamCount, constraints.schedule, constraints.playStyle, recommendQuery.data?.primary.format])

  const handleApply = () => {
    const params = new URLSearchParams({
      format: selectedFormat,
      maxTeams: String(teamCount),
      from: 'planner',
    })
    router.push(`/dashboard/tournaments/create?${params.toString()}`)
  }

  return (
    <div className='space-y-6'>
      <div className='grid gap-6 lg:grid-cols-[minmax(0,340px)_1fr]'>
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2 text-lg'>
              <Sparkles className='h-5 w-5 text-primary' />
              Tournament setup
            </CardTitle>
            <CardDescription>
              Enter how many teams you expect. We&apos;ll suggest the best format for your schedule.
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-5'>
            <div className='space-y-2'>
              <Label htmlFor='teamCount'>Expected team count</Label>
              <Input
                id='teamCount'
                type='number'
                min={2}
                max={128}
                value={teamCount}
                onChange={(e) => setTeamCount(parseInt(e.target.value, 10) || 2)}
              />
              <p className='text-xs text-muted-foreground'>Between 2 and 128 teams</p>
            </div>

            <div className='space-y-2'>
              <Label>Schedule</Label>
              <Select
                value={constraints.schedule ?? 'multi_day'}
                onValueChange={(value) =>
                  setConstraints((c) => ({
                    ...c,
                    schedule: value as PlannerConstraints['schedule'],
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='single_day'>Single day / LAN</SelectItem>
                  <SelectItem value='multi_day'>Multi-day event</SelectItem>
                  <SelectItem value='weekly'>Weekly league</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className='space-y-2'>
              <Label>Play style</Label>
              <Select
                value={constraints.playStyle ?? 'balanced'}
                onValueChange={(value) =>
                  setConstraints((c) => ({
                    ...c,
                    playStyle: value as PlannerConstraints['playStyle'],
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='fast'>Fast — crown a winner quickly</SelectItem>
                  <SelectItem value='balanced'>Balanced</SelectItem>
                  <SelectItem value='everyone_plays'>Everyone plays multiple games</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {!teamCountValid && (
              <Alert variant='destructive'>
                <AlertDescription>Team count must be between 2 and 128.</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recommendations</CardTitle>
            <CardDescription>
              Ranked for {teamCount} teams with your constraints. Pick any format to preview.
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-3'>
            {recommendQuery.isLoading && (
              <div className='flex items-center gap-2 text-muted-foreground py-8 justify-center'>
                <Loader2 className='h-5 w-5 animate-spin' />
                Calculating options…
              </div>
            )}

            {recommendQuery.isError && (
              <Alert variant='destructive'>
                <AlertDescription>{recommendQuery.error.message}</AlertDescription>
              </Alert>
            )}

            {recommendations.map((rec) => (
              <button
                key={rec.format}
                type='button'
                onClick={() => setSelectedFormat(rec.format)}
                className={`w-full text-left rounded-lg border p-4 transition-colors ${
                  selectedFormat === rec.format
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <div className='flex items-start justify-between gap-2'>
                  <div>
                    <div className='flex items-center gap-2 flex-wrap'>
                      <span className='font-semibold'>{FORMAT_LABELS[rec.format]}</span>
                      {rec.rank === 1 && (
                        <Badge variant='default' className='text-xs'>
                          Recommended
                        </Badge>
                      )}
                      {rec.rank === 2 && (
                        <Badge variant='secondary' className='text-xs'>
                          Alternative
                        </Badge>
                      )}
                    </div>
                    <p className='text-sm text-muted-foreground mt-1'>{rec.summary}</p>
                  </div>
                  {selectedFormat === rec.format && (
                    <CheckCircle2 className='h-5 w-5 text-primary shrink-0' />
                  )}
                </div>
                <ul className='mt-2 text-xs text-muted-foreground space-y-0.5'>
                  {rec.pros.slice(0, 2).map((pro) => (
                    <li key={pro}>+ {pro}</li>
                  ))}
                </ul>
              </button>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
          <div>
            <CardTitle>Bracket preview</CardTitle>
            <CardDescription>
              Planning preview for {FORMAT_LABELS[selectedFormat]}. Final bracket is generated after
              registration.
            </CardDescription>
          </div>
          <Select
            value={selectedFormat}
            onValueChange={(v) => setSelectedFormat(v as TournamentFormatId)}
          >
            <SelectTrigger className='w-full sm:w-[200px]'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FORMAT_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          {previewQuery.isLoading && (
            <div className='flex justify-center py-12'>
              <Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
            </div>
          )}

          {selectedFormat === 'DOUBLE_ELIMINATION' && (
            <Alert className='mb-4'>
              <AlertDescription>
                Preview shows winners bracket round 1 only. Full double-elimination tree is larger.
              </AlertDescription>
            </Alert>
          )}

          {previewQuery.data?.matches && (
            <BracketView
              matches={previewQuery.data.matches}
              tournamentFormat={selectedFormat}
            />
          )}
        </CardContent>
      </Card>

      <div className='flex flex-wrap gap-3 justify-end'>
        <Button variant='outline' asChild>
          <Link href='/dashboard/tournaments/create'>Skip — create manually</Link>
        </Button>
        <Button
          className='gradient-purple glow-purple-hover gap-2'
          onClick={handleApply}
          disabled={!teamCountValid}
        >
          Use this format
          <ArrowRight className='h-4 w-4' />
        </Button>
      </div>
    </div>
  )
}
