import { registrationOrganizer } from './registration-organizer'
import { registrationPlayer } from './registration-player'

export const tournamentRegistration = {
  ...registrationPlayer,
  ...registrationOrganizer,
}
