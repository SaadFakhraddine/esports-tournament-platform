/** Server-only: OAuth env resolution (Auth.js also reads AUTH_{PROVIDER}_{ID|SECRET}). */

export type OAuthClientCredentials = { clientId: string; clientSecret: string }

function pickEnv(...keys: string[]): string | undefined {
  for (const key of keys) {
    const v = process.env[key]?.trim()
    if (v) return v
  }
  return undefined
}

/** Discord: DISCORD_* or Auth.js–style AUTH_DISCORD_* */
export function getDiscordOAuthCredentials(): OAuthClientCredentials | null {
  const clientId = pickEnv('DISCORD_CLIENT_ID', 'AUTH_DISCORD_ID')
  const clientSecret = pickEnv('DISCORD_CLIENT_SECRET', 'AUTH_DISCORD_SECRET')
  if (!clientId || !clientSecret) return null
  return { clientId, clientSecret }
}

/** Google: GOOGLE_* or Auth.js–style AUTH_GOOGLE_* */
export function getGoogleOAuthCredentials(): OAuthClientCredentials | null {
  const clientId = pickEnv('GOOGLE_CLIENT_ID', 'AUTH_GOOGLE_ID')
  const clientSecret = pickEnv('GOOGLE_CLIENT_SECRET', 'AUTH_GOOGLE_SECRET')
  if (!clientId || !clientSecret) return null
  return { clientId, clientSecret }
}

export function isDiscordOAuthConfigured(): boolean {
  return getDiscordOAuthCredentials() !== null
}

export function isGoogleOAuthConfigured(): boolean {
  return getGoogleOAuthCredentials() !== null
}
