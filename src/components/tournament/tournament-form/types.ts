export interface TournamentFormState {
  name: string
  description: string
  gameId: string
  format: string
  maxTeams: number
  startDate: Date | null
  endDate: Date | null
  registrationStart: Date | null
  registrationEnd: Date | null
  rules: string
  prizePool: string
  banner: string
}

export interface TournamentFormTournament {
  id: string
  name: string
  description?: string | null
  game: string
  format: string
  maxTeams: number
  startDate: Date
  endDate?: Date | null
  registrationStart?: Date
  registrationEnd?: Date
  rules?: string | null
  prizePool?: string | null
  banner?: string | null
  visibility?: string
  status?: string
}
