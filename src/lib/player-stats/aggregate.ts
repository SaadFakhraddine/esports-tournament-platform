export type MatchResult = 'win' | 'loss' | 'unknown'

export type PlayerMatchRecord = {
  id: string
  completedAt: Date | null
  homeTeamId: string | null
  awayTeamId: string | null
  winnerTeamId: string | null
  gameId: string
  gameName: string
}

export type StatsRange = '3m' | '6m' | '12m' | 'all'

export type MatchOverTimeBucket = {
  period: string
  wins: number
  losses: number
  played: number
}

export type WinRateOverTimePoint = {
  period: string
  winRate: number
}

export type FormEntry = {
  result: MatchResult
  completedAt: Date | null
  gameName: string
}

export type CurrentStreak = {
  type: 'win' | 'loss'
  count: number
} | null

export type BestHighlight = {
  id: string
  name: string
  winRate: number
  played: number
} | null

const MIN_HIGHLIGHT_PLAYED = 3

export function yourTeamIdForMatch(
  homeTeamId: string | null,
  awayTeamId: string | null,
  teamIdSet: Set<string>,
): string | null {
  if (homeTeamId && teamIdSet.has(homeTeamId)) return homeTeamId
  if (awayTeamId && teamIdSet.has(awayTeamId)) return awayTeamId
  return null
}

export function matchResultForUser(
  winnerTeamId: string | null,
  yourTeamId: string | null,
): MatchResult {
  if (!winnerTeamId || !yourTeamId) return 'unknown'
  return winnerTeamId === yourTeamId ? 'win' : 'loss'
}

export function filterMatchesByRange(
  matches: PlayerMatchRecord[],
  range: StatsRange,
  now: Date = new Date(),
): PlayerMatchRecord[] {
  if (range === 'all') return matches

  const months = range === '3m' ? 3 : range === '6m' ? 6 : 12
  const cutoff = new Date(now)
  cutoff.setMonth(cutoff.getMonth() - months)

  return matches.filter((m) => {
    if (!m.completedAt) return false
    return m.completedAt >= cutoff
  })
}

export function filterMatchesByGame(
  matches: PlayerMatchRecord[],
  gameId: string | undefined,
): PlayerMatchRecord[] {
  if (!gameId) return matches
  return matches.filter((m) => m.gameId === gameId)
}

export function filterMatchesByTeam(
  matches: PlayerMatchRecord[],
  teamId: string | undefined,
  teamIdSet: Set<string>,
): PlayerMatchRecord[] {
  if (!teamId) return matches
  if (!teamIdSet.has(teamId)) return matches

  return matches.filter((m) => {
    const yt = yourTeamIdForMatch(m.homeTeamId, m.awayTeamId, teamIdSet)
    return yt === teamId
  })
}

export function toSortedMatchRecords(
  matches: PlayerMatchRecord[],
): PlayerMatchRecord[] {
  return [...matches].sort((a, b) => {
    const ta = a.completedAt?.getTime() ?? 0
    const tb = b.completedAt?.getTime() ?? 0
    return tb - ta
  })
}

export function buildForm(
  matches: PlayerMatchRecord[],
  teamIdSet: Set<string>,
  limit = 10,
): FormEntry[] {
  const sorted = toSortedMatchRecords(matches)

  return sorted.slice(0, limit).map((m) => {
    const yourTeamId = yourTeamIdForMatch(m.homeTeamId, m.awayTeamId, teamIdSet)
    return {
      result: matchResultForUser(m.winnerTeamId, yourTeamId),
      completedAt: m.completedAt,
      gameName: m.gameName,
    }
  })
}

export function buildCurrentStreak(
  matches: PlayerMatchRecord[],
  teamIdSet: Set<string>,
): CurrentStreak {
  const sorted = toSortedMatchRecords(matches)
  if (sorted.length === 0) return null

  const first = sorted[0]
  const firstTeamId = yourTeamIdForMatch(first.homeTeamId, first.awayTeamId, teamIdSet)
  const firstResult = matchResultForUser(first.winnerTeamId, firstTeamId)
  if (firstResult === 'unknown') return null

  let count = 0
  for (const m of sorted) {
    const yourTeamId = yourTeamIdForMatch(m.homeTeamId, m.awayTeamId, teamIdSet)
    const result = matchResultForUser(m.winnerTeamId, yourTeamId)
    if (result !== firstResult) break
    count++
  }

  return { type: firstResult, count }
}

function periodKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function formatPeriodLabel(key: string): string {
  const [year, month] = key.split('-')
  const d = new Date(Number(year), Number(month) - 1, 1)
  return d.toLocaleDateString(undefined, { month: 'short', year: '2-digit' })
}

export function buildMatchesOverTime(
  matches: PlayerMatchRecord[],
  teamIdSet: Set<string>,
): MatchOverTimeBucket[] {
  const bucketMap = new Map<string, { wins: number; losses: number }>()

  for (const m of matches) {
    if (!m.completedAt) continue
    const key = periodKey(m.completedAt)
    if (!bucketMap.has(key)) {
      bucketMap.set(key, { wins: 0, losses: 0 })
    }
    const bucket = bucketMap.get(key)!
    const yourTeamId = yourTeamIdForMatch(m.homeTeamId, m.awayTeamId, teamIdSet)
    const result = matchResultForUser(m.winnerTeamId, yourTeamId)
    if (result === 'win') bucket.wins++
    else if (result === 'loss') bucket.losses++
  }

  return Array.from(bucketMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, { wins, losses }]) => ({
      period: formatPeriodLabel(key),
      wins,
      losses,
      played: wins + losses,
    }))
}

export function buildWinRateOverTime(
  matches: PlayerMatchRecord[],
  teamIdSet: Set<string>,
): WinRateOverTimePoint[] {
  const buckets = buildMatchesOverTime(matches, teamIdSet)
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

export function computeSummaryFromMatches(
  matches: PlayerMatchRecord[],
  teamIdSet: Set<string>,
): { completedMatches: number; wins: number; losses: number; winRate: number } {
  let wins = 0
  for (const m of matches) {
    const yourTeamId = yourTeamIdForMatch(m.homeTeamId, m.awayTeamId, teamIdSet)
    if (m.winnerTeamId && yourTeamId && m.winnerTeamId === yourTeamId) {
      wins++
    }
  }
  const completedMatches = matches.length
  const losses = completedMatches - wins
  const winRate = completedMatches > 0 ? Math.round((wins / completedMatches) * 100) : 0
  return { completedMatches, wins, losses, winRate }
}

export function findBestHighlight(
  rows: Array<{ id: string; name: string; played: number; wins: number }>,
): BestHighlight {
  const eligible = rows.filter((r) => r.played >= MIN_HIGHLIGHT_PLAYED)
  if (eligible.length === 0) return null

  const best = eligible.reduce((a, b) => {
    const aRate = a.played > 0 ? a.wins / a.played : 0
    const bRate = b.played > 0 ? b.wins / b.played : 0
    if (bRate !== aRate) return bRate > aRate ? b : a
    return b.played > a.played ? b : a
  })

  return {
    id: best.id,
    name: best.name,
    played: best.played,
    winRate: best.played > 0 ? Math.round((best.wins / best.played) * 100) : 0,
  }
}
