const EVENT_TYPES = [
  'Open',
  'Cup',
  'Championship',
  'Invitational',
  'Clash',
  'Showdown',
  'Circuit',
  'League',
  'Qualifier',
  'Classic',
] as const

const ADJECTIVES = [
  'Spring',
  'Summer',
  'Fall',
  'Winter',
  'Regional',
  'Community',
  'Elite',
  'Amateur',
  'Weekly',
  'Grand',
] as const

const FORMAT_LABELS: Record<string, string> = {
  SINGLE_ELIMINATION: 'Knockout',
  DOUBLE_ELIMINATION: 'Showdown',
  ROUND_ROBIN: 'Round Robin',
  SWISS: 'Swiss',
}

type RandomFn = () => number

function pick<T>(arr: readonly T[], random: RandomFn): T {
  return arr[Math.floor(random() * arr.length)]!
}

export function getSeasonLabel(date: Date | null | undefined, now = new Date()): string {
  const d = date ?? now
  const month = d.getMonth()
  const year = d.getFullYear()
  if (month >= 2 && month <= 4) return `Spring ${year}`
  if (month >= 5 && month <= 7) return `Summer ${year}`
  if (month >= 8 && month <= 10) return `Fall ${year}`
  return `Winter ${year}`
}

function buildName(
  gameName: string,
  format: string,
  seasonLabel: string,
  random: RandomFn,
): string {
  const formatLabel = FORMAT_LABELS[format] ?? 'Tournament'
  const eventType = pick(EVENT_TYPES, random)
  const adjective = pick(ADJECTIVES, random)
  const pattern = Math.floor(random() * 5)

  switch (pattern) {
    case 0:
      return `${gameName} ${eventType} ${seasonLabel}`
    case 1:
      return `${seasonLabel} ${gameName} ${formatLabel}`
    case 2:
      return `${adjective} ${gameName} ${eventType}`
    case 3:
      return `${gameName} ${formatLabel} ${seasonLabel}`
    default:
      return `${adjective} ${gameName} ${formatLabel}`
  }
}

export function suggestTournamentNames(input: {
  gameName: string
  format: string
  startDate?: Date | null
  count?: number
  random?: RandomFn
}): string[] {
  const gameName = input.gameName.trim()
  if (!gameName) return []

  const random = input.random ?? Math.random
  const count = input.count ?? 3
  const seasonLabel = getSeasonLabel(input.startDate)
  const names = new Set<string>()

  for (let attempt = 0; attempt < 50 && names.size < count; attempt++) {
    names.add(buildName(gameName, input.format, seasonLabel, random))
  }

  return [...names].slice(0, count)
}
