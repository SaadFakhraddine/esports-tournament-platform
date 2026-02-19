import { z } from 'zod'
import { TournamentFormat, TournamentStatus } from '@prisma/client'

export const createTournamentSchema = z.object({
  name: z.string().min(3).max(100),
  description: z.string().optional(),
  gameId: z.string().min(1, 'Game is required'),
  format: z.nativeEnum(TournamentFormat),
  maxTeams: z.number().int().min(2).max(128),
  startDate: z.date(),
  endDate: z.date().optional(),
  registrationStart: z.date(),
  registrationEnd: z.date(),
  rules: z.string().optional(),
  prizePool: z.string().optional(),
  banner: z.string().url().optional(),
})

export const updateTournamentSchema = z.object({
  id: z.string(),
  name: z.string().min(3).max(100).optional(),
  description: z.string().optional(),
  gameId: z.string().optional(),
  format: z.nativeEnum(TournamentFormat).optional(),
  maxTeams: z.number().int().min(2).max(128).optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  registrationStart: z.date().optional(),
  registrationEnd: z.date().optional(),
  rules: z.string().optional(),
  prizePool: z.string().optional(),
  banner: z.string().url().optional(),
  status: z.nativeEnum(TournamentStatus).optional(),
})

export const getTournamentsSchema = z.object({
  game: z.string().optional(),
  status: z.nativeEnum(TournamentStatus).optional(),
  search: z.string().optional(),
  limit: z.number().int().min(1).max(100).default(10),
  cursor: z.string().optional(),
})

export type CreateTournamentInput = z.infer<typeof createTournamentSchema>
export type UpdateTournamentInput = z.infer<typeof updateTournamentSchema>
export type GetTournamentsInput = z.infer<typeof getTournamentsSchema>
