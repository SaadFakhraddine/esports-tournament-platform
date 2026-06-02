export type RegistrationType = {
  id: string
  seed?: number | null
  status: string
  registeredAt: Date | string
  team: {
    id: string
    name: string
    tag?: string | null
    logo?: string | null
  }
}

export type ActionDialogState = {
  open: boolean
  type: 'approve' | 'reject' | null
  registrationId: string | null
  teamName: string | null
}
