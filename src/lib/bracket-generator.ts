export type {
  Team,
  Slot,
  BracketTransition,
  BracketMatch,
  BracketStructure,
} from './bracket/types'

export {
  generateSingleElimination,
  generateRoundRobin,
  generateDoubleElimination,
  generateSwiss,
} from './bracket/structure'

export { generateBracket, autoSeedTeams } from './bracket/persist'
