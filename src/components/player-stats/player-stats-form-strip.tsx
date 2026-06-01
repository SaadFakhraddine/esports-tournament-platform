import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { PlayerStatsOutput } from './types'

type Props = {
  form: PlayerStatsOutput['form']
}

export function PlayerStatsFormStrip({ form }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent form</CardTitle>
        <CardDescription>Last {form.length} completed matches</CardDescription>
      </CardHeader>
      <CardContent>
        {form.length === 0 ? (
          <p className='text-sm text-muted-foreground text-center py-4'>No matches yet.</p>
        ) : (
          <div className='flex flex-wrap gap-2'>
            {form.map((entry, i) => (
              <Badge
                key={`${entry.completedAt?.toString() ?? i}-${i}`}
                variant={entry.result === 'win' ? 'default' : entry.result === 'loss' ? 'secondary' : 'outline'}
                className='min-w-[2.5rem] justify-center font-mono'
                title={entry.gameName}
              >
                {entry.result === 'win' ? 'W' : entry.result === 'loss' ? 'L' : '?'}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
