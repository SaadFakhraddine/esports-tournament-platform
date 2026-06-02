import { BracketType } from '@prisma/client'

export interface Team {
  id: string
  seed: number | null
}

export type Slot = 'home' | 'away'

export interface BracketTransition {
  bracketType: BracketType
  round: number
  position: number
  slot: Slot
}

export interface BracketMatch {
  position: number
  homeTeamId: string | null
  awayTeamId: string | null
  nextMatchWinner?: BracketTransition
  nextMatchLoser?: BracketTransition
}

export interface BracketStructure {
  brackets: Array<{
    type: BracketType
    round: number
    matches: BracketMatch[]
  }>
}
