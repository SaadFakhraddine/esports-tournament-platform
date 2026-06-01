'use client'

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
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
  wins: { label: 'Wins', color: 'hsl(var(--chart-3))' },
  losses: { label: 'Losses', color: 'hsl(var(--chart-5))' },
} satisfies ChartConfig

type Props = {
  data: PlayerStatsOutput['matchesOverTime']
}

export function PlayerStatsActivityChart({ data }: Props) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Match activity</CardTitle>
          <CardDescription>Wins and losses per month</CardDescription>
        </CardHeader>
        <CardContent>
          <p className='text-sm text-muted-foreground text-center py-8'>
            No match history in this period.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Match activity</CardTitle>
        <CardDescription>Wins and losses per month</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className='h-[260px] w-full'>
          <BarChart data={data} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
            <CartesianGrid vertical={false} strokeDasharray='3 3' />
            <XAxis dataKey='period' tickLine={false} axisLine={false} tickMargin={8} />
            <YAxis tickLine={false} axisLine={false} tickMargin={8} allowDecimals={false} />
            <ChartTooltip
              content={({ active, payload, label }) => (
                <ChartTooltipContent
                  active={active}
                  payload={payload as ReadonlyArray<TooltipPayloadItem> | undefined}
                  label={label}
                />
              )}
            />
            <Bar
              dataKey='wins'
              stackId='a'
              fill='var(--color-wins)'
              activeBar={{ fill: 'var(--color-wins)', opacity: 0.85 }}
            />
            <Bar
              dataKey='losses'
              stackId='a'
              fill='var(--color-losses)'
              activeBar={{ fill: 'var(--color-losses)', opacity: 0.85 }}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
