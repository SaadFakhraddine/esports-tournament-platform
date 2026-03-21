'use client'

import { TournamentForm } from '@/components/tournament/tournament-form'
import type { inferRouterOutputs } from '@trpc/server'
import type { AppRouter } from '@/server/api/root'

type ManageOverview = inferRouterOutputs<AppRouter>['tournament']['getManageOverviewById']

export function TournamentManageSettingsTab({ tournament }: { tournament: ManageOverview }) {
  return (
    <TournamentForm
      tournament={{
        id: tournament.id,
        name: tournament.name,
        description: tournament.description,
        game: tournament.game.id,
        format: tournament.format,
        maxTeams: tournament.maxTeams,
        startDate: tournament.startDate,
        endDate: tournament.endDate,
        registrationStart: tournament.registrationStart,
        registrationEnd: tournament.registrationEnd,
        rules: tournament.rules,
        prizePool: tournament.prizePool,
        banner: tournament.banner,
        status: tournament.status,
      }}
      mode='edit'
    />
  )
}
