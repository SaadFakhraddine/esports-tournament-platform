/**
 * Helpers for the "add team to tournament" search UI.
 */

export type RegistrationWithTeam = {
  team: { id: string }
  status: string
}

export function getRegistrationStatusForTeam(
  registrations: RegistrationWithTeam[] | undefined,
  teamId: string
): string | undefined {
  return registrations?.find((r) => r.team.id === teamId)?.status
}

/** Blocks quick-add when the team already has an active registration row. */
export function isTeamBlockedFromQuickAdd(status: string | undefined): boolean {
  return status === 'APPROVED' || status === 'PENDING'
}

export function quickAddStatusBadge(
  status: string | undefined
): { label: string; variant: 'secondary' | 'outline' } | null {
  if (status === 'APPROVED') return { label: 'In tournament', variant: 'secondary' }
  if (status === 'PENDING') return { label: 'Pending approval', variant: 'outline' }
  return null
}
