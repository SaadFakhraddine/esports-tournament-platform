import { describe, expect, test } from 'vitest'
import { TournamentFormat } from '@prisma/client'
import { createTournamentSchema, getTournamentsSchema, updateTournamentSchema } from './tournament'

const baseDate = new Date('2026-06-01T12:00:00.000Z')
const laterDate = new Date('2026-06-15T12:00:00.000Z')
const regEnd = new Date('2026-05-20T12:00:00.000Z')
const regStart = new Date('2026-05-01T12:00:00.000Z')

function validCreatePayload() {
  return {
    name: 'Summer Championship',
    description: 'Test',
    gameId: 'game-id-1',
    format: TournamentFormat.SINGLE_ELIMINATION,
    maxTeams: 8,
    startDate: baseDate,
    endDate: laterDate,
    registrationStart: regStart,
    registrationEnd: regEnd,
    rules: 'Be nice',
    prizePool: '$1000',
    banner: 'https://example.com/banner.jpg',
  }
}

describe('createTournamentSchema', () => {
  test('accepts a valid payload', () => {
    const r = createTournamentSchema.safeParse(validCreatePayload())
    expect(r.success).toBe(true)
  })

  test('rejects name shorter than 3 characters', () => {
    const r = createTournamentSchema.safeParse({ ...validCreatePayload(), name: 'AB' })
    expect(r.success).toBe(false)
  })

  test('rejects maxTeams below 2', () => {
    const r = createTournamentSchema.safeParse({ ...validCreatePayload(), maxTeams: 1 })
    expect(r.success).toBe(false)
  })

  test('rejects invalid banner URL when provided', () => {
    const r = createTournamentSchema.safeParse({ ...validCreatePayload(), banner: 'not-a-url' })
    expect(r.success).toBe(false)
  })

  test('allows omitting optional banner', () => {
    const payload = { ...validCreatePayload() } as Record<string, unknown>
    delete payload.banner
    const r = createTournamentSchema.safeParse(payload)
    expect(r.success).toBe(true)
  })
})

describe('getTournamentsSchema', () => {
  test('applies default limit', () => {
    const r = getTournamentsSchema.safeParse({})
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.limit).toBe(10)
  })
})

describe('updateTournamentSchema', () => {
  test('requires id', () => {
    const r = updateTournamentSchema.safeParse({ name: 'Updated' })
    expect(r.success).toBe(false)
  })

  test('accepts id with partial fields', () => {
    const r = updateTournamentSchema.safeParse({ id: 't-1', name: 'New Name' })
    expect(r.success).toBe(true)
  })
})
