import { RegisterForm } from './register-form'
import { isDiscordOAuthConfigured, isGoogleOAuthConfigured } from '@/server/auth/oauth-env'

export default function RegisterPage() {
  return (
    <RegisterForm
      discordOAuthEnabled={isDiscordOAuthConfigured()}
      googleOAuthEnabled={isGoogleOAuthConfigured()}
    />
  )
}
