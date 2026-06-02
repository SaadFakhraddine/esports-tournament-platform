import { MatchStatus, Prisma } from '@prisma/client'
import type { PrismaClient } from '@prisma/client'
import type { StatsRange } from './aggregate'

export function rangeCutoff(range: StatsRange, now: Date = new Date()): Date | null {
  if (range === 'all') return null

  const months = range === '3m' ? 3 : range === '6m' ? 6 : 12
  const cutoff = new Date(now)
  cutoff.setMonth(cutoff.getMonth() - months)
  return cutoff
}

export function buildCompletedMatchWhere(
  teamIds: string[],
  opts: { range: StatsRange; gameId?: string; teamId?: string },
) {
  const scopedTeamIds =
    opts.teamId && teamIds.includes(opts.teamId) ? [opts.teamId] : teamIds

  const cutoff = rangeCutoff(opts.range)

  return {
    status: MatchStatus.COMPLETED,
    ...(cutoff ? { completedAt: { gte: cutoff } } : {}),
    ...(opts.gameId ? { tournament: { gameId: opts.gameId } } : {}),
    OR: [{ homeTeamId: { in: scopedTeamIds } }, { awayTeamId: { in: scopedTeamIds } }],
  }
}

type MonthlyBucketRow = {
  period_key: string
  wins: number
  losses: number
}

function formatPeriodLabel(key: string): string {
  const [year, month] = key.split('-')
  const d = new Date(Number(year), Number(month) - 1, 1)
  return d.toLocaleDateString(undefined, { month: 'short', year: '2-digit' })
}

function teamIdArraySql(teamIds: string[]) {
  return Prisma.sql`ARRAY[${Prisma.join(teamIds.map((id) => Prisma.sql`${id}`))}]::text[]`
}

export async function queryMonthlyMatchBuckets(
  db: Pick<PrismaClient, '$queryRaw'>,
  teamIds: string[],
  opts: { range: StatsRange; gameId?: string; teamId?: string },
): Promise<Array<{ period: string; wins: number; losses: number; played: number }>> {
  if (teamIds.length === 0) return []

  const scopedTeamIds =
    opts.teamId && teamIds.includes(opts.teamId) ? [opts.teamId] : teamIds
  const cutoff = rangeCutoff(opts.range)
  const teamArray = teamIdArraySql(scopedTeamIds)

  const rows = await db.$queryRaw<MonthlyBucketRow[]>`
    SELECT
      to_char(m."completedAt", 'YYYY-MM') AS period_key,
      COUNT(*) FILTER (
        WHERE m."winnerTeamId" IS NOT NULL
          AND (
            (m."homeTeamId" = ANY(${teamArray}) AND m."winnerTeamId" = m."homeTeamId")
            OR (m."awayTeamId" = ANY(${teamArray}) AND m."winnerTeamId" = m."awayTeamId")
          )
      )::int AS wins,
      COUNT(*) FILTER (
        WHERE m."winnerTeamId" IS NOT NULL
          AND (
            m."homeTeamId" = ANY(${teamArray}) OR m."awayTeamId" = ANY(${teamArray})
          )
          AND NOT (
            (m."homeTeamId" = ANY(${teamArray}) AND m."winnerTeamId" = m."homeTeamId")
            OR (m."awayTeamId" = ANY(${teamArray}) AND m."winnerTeamId" = m."awayTeamId")
          )
      )::int AS losses
    FROM "Match" m
    INNER JOIN "Tournament" t ON m."tournamentId" = t.id
    WHERE m.status = 'COMPLETED'
      AND m."completedAt" IS NOT NULL
      AND (
        m."homeTeamId" = ANY(${teamArray})
        OR m."awayTeamId" = ANY(${teamArray})
      )
      AND (${cutoff}::timestamptz IS NULL OR m."completedAt" >= ${cutoff})
      AND (${opts.gameId ?? null}::text IS NULL OR t."gameId" = ${opts.gameId ?? null})
    GROUP BY period_key
    ORDER BY period_key ASC
  `

  return rows.map((row) => ({
    period: formatPeriodLabel(row.period_key),
    wins: row.wins,
    losses: row.losses,
    played: row.wins + row.losses,
  }))
}

export function buildWinRateOverTimeFromBuckets(
  buckets: Array<{ period: string; wins: number; losses: number; played: number }>,
): Array<{ period: string; winRate: number }> {
  let cumulativeWins = 0
  let cumulativePlayed = 0

  return buckets.map((bucket) => {
    cumulativeWins += bucket.wins
    cumulativePlayed += bucket.played
    const winRate =
      cumulativePlayed > 0 ? Math.round((cumulativeWins / cumulativePlayed) * 100) : 0
    return { period: bucket.period, winRate }
  })
}
