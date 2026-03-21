import { TRPCError } from '@trpc/server'

/** Minimal user shape from protected / organizer procedures (after auth middleware). */
type AuthedUser = {
  id: string
  role: string
}

export function throwTournamentNotFound(): never {
  throw new TRPCError({
    code: 'NOT_FOUND',
    message: 'Tournament not found',
  })
}

/** Tournament organizer or platform admin may act; otherwise FORBIDDEN with your message. */
export function assertTournamentOrganizerOrAdmin(
  user: AuthedUser,
  tournamentOrganizerId: string,
  forbiddenMessage: string,
): void {
  if (tournamentOrganizerId !== user.id && user.role !== 'ADMIN') {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: forbiddenMessage,
    })
  }
}
