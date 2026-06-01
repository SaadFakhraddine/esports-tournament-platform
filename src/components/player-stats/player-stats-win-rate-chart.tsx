'use client'

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
  type TooltipPayloadItem,
} from '@/components/ui/chart'
import type { PlayerStatsOutput } from './types'

const chartConfig = {
  winRate: { label: 'Win rate', color: 'hsl(var(--chart-1))' },
} satisfies ChartConfig

type Props = {
  data: PlayerStatsOutput['winRateOverTime']
  compact?: boolean
}

export function PlayerStatsWinRateChart({ data, compact }: Props) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader className={compact ? 'pb-2' : undefined}>
          <CardTitle className={compact ? 'text-base' : undefined}>Win rate over time</CardTitle>
          {!compact && (
            <CardDescription>Cumulative win rate by month</CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <p className='text-sm text-muted-foreground text-center py-8'>
            Play more matches to see trends.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className={compact ? 'pb-2' : undefined}>
        <CardTitle className={compact ? 'text-base' : undefined}>Win rate over time</CardTitle>
        {!compact && <CardDescription>Cumulative win rate by month</CardDescription>}
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className={compact ? 'h-[140px] w-full' : 'h-[260px] w-full'}>
          <AreaChart data={data} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
            <CartesianGrid vertical={false} strokeDasharray='3 3' />
            <XAxis dataKey='period' tickLine={false} axisLine={false} tickMargin={8} />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              domain={[0, 100]}
              tickFormatter={(v) => `${v}%`}
            />
            <ChartTooltip
              content={({ active, payload, label }) => (
                <ChartTooltipContent
                  active={active}
                  payload={payload as ReadonlyArray<TooltipPayloadItem> | undefined}
                  label={label}
                  formatter={(value) => [`${value}%`, 'Win rate']}
                />
              )}
            />
            <Area
              type='monotone'
              dataKey='winRate'
              stroke='var(--color-winRate)'
              fill='var(--color-winRate)'
              fillOpacity={0.2}
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
