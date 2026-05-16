import { LoginForm } from './login-form'
import { isDiscordOAuthConfigured, isGoogleOAuthConfigured } from '@/server/auth/oauth-env'

export default function LoginPage() {
  return (
    <LoginForm
      discordOAuthEnabled={isDiscordOAuthConfigured()}
      googleOAuthEnabled={isGoogleOAuthConfigured()}
    />
  )
}
