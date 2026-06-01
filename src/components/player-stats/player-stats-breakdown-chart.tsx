'use client'

import { Bar, BarChart, XAxis, YAxis } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
  type TooltipPayloadItem,
} from '@/components/ui/chart'

const chartConfig = {
  winRate: { label: 'Win rate', color: 'hsl(var(--chart-1))' },
} satisfies ChartConfig

type BreakdownRow = {
  id: string
  name: string
  played: number
  wins: number
  losses: number
  winRate: number
}

type Props = {
  title: string
  description: string
  rows: BreakdownRow[]
}

export function PlayerStatsBreakdownChart({ title, description, rows }: Props) {
  const chartData = rows
    .filter((r) => r.played > 0)
    .slice(0, 8)
    .map((r) => ({
      name: r.name.length > 14 ? `${r.name.slice(0, 14)}…` : r.name,
      fullName: r.name,
      winRate: r.winRate,
      wins: r.wins,
      losses: r.losses,
      played: r.played,
    }))

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className='text-sm text-muted-foreground text-center py-8'>No data yet.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className='h-[220px] w-full'>
          <BarChart
            data={chartData}
            layout='vertical'
            margin={{ left: 4, right: 16, top: 4, bottom: 4 }}
          >
            <XAxis type='number' domain={[0, 100]} tickFormatter={(v) => `${v}%`} hide />
            <YAxis
              type='category'
              dataKey='name'
              width={96}
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 12 }}
            />
            <ChartTooltip
              content={({ active, payload }) => {
                const row = payload?.[0]?.payload as
                  | { fullName?: string; wins: number; losses: number }
                  | undefined
                return (
                  <ChartTooltipContent
                    active={active}
                    payload={payload as ReadonlyArray<TooltipPayloadItem> | undefined}
                    label={row?.fullName}
                    formatter={(value) => [
                      `${value}% (${row?.wins ?? 0}W ${row?.losses ?? 0}L)`,
                      'Win rate',
                    ]}
                  />
                )
              }}
            />
            <Bar dataKey='winRate' fill='var(--color-winRate)' radius={[0, 4, 4, 0]} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
