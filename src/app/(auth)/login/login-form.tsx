'use client'

import { Suspense, useEffect, useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { Loader2, AlertCircle } from 'lucide-react'
import { validateRedirectUrl } from '@/lib/security/redirect-validation'

const oauthErrorMessages: Record<string, string> = {
  Configuration:
    'OAuth failed to start (often missing NEXTAUTH_SECRET, wrong callback URL, or invalid client ID). Restart the dev server after changing .env.',
  AccessDenied: 'Sign-in was cancelled or your account cannot be used with this app.',
  Verification: 'The sign-in link is no longer valid. Please try again.',
  OAuthAccountNotLinked:
    'This sign-in method is not linked to your account. Sign in with the method you used originally, then contact support if you need help.',
  OAuthSignin: 'Could not start OAuth sign-in. Try again or use email and password.',
  OAuthCallback: 'OAuth callback failed. Check that your callback URL matches the provider settings.',
  Default: 'Sign-in failed. Try again or use email and password.',
}

function oauthErrorMessage(code: string | null): string | null {
  if (!code) return null
  return oauthErrorMessages[code] ?? oauthErrorMessages.Default
}

export type LoginFormProps = {
  discordOAuthEnabled: boolean
  googleOAuthEnabled: boolean
}

function LoginFormInner({ discordOAuthEnabled, googleOAuthEnabled }: LoginFormProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)
  const [oauthLoading, setOauthLoading] = useState<'discord' | 'google' | null>(null)
  const [error, setError] = useState<string | null>(null)

  const returnUrlParam = searchParams?.get('returnUrl')
  const returnUrl = validateRedirectUrl(returnUrlParam)
  const registerHref =
    returnUrlParam != null && returnUrlParam !== ''
      ? `/register?returnUrl=${encodeURIComponent(returnUrl)}`
      : '/register'

  const oauthConfigured = discordOAuthEnabled || googleOAuthEnabled

  useEffect(() => {
    const oauthError = searchParams?.get('error')
    const msg = oauthErrorMessage(oauthError)
    if (msg) setError(msg)
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError('Invalid email or password')
      } else {
        router.push(returnUrl)
        router.refresh()
      }
    } catch {
      setError('Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  const oauthBusy = oauthLoading !== null

  return (
    <div className='min-h-screen flex items-center justify-center bg-gradient-to-b from-purple-900 via-purple-800 to-gray-900 px-4'>
      <Card className='w-full max-w-md'>
        <CardHeader className='space-y-1'>
          <CardTitle className='text-2xl font-bold text-center'>Sign In</CardTitle>
          <CardDescription className='text-center'>
            Enter your credentials to access your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='email'>Email</Label>
              <Input
                id='email'
                name='email'
                type='email'
                placeholder='john@example.com'
                required
                disabled={isLoading || oauthBusy}
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='password'>Password</Label>
              <Input
                id='password'
                name='password'
                type='password'
                placeholder='••••••••'
                required
                disabled={isLoading || oauthBusy}
              />
            </div>

            {error && (
              <Alert variant='destructive'>
                <AlertCircle className='h-4 w-4' />
                <AlertTitle>Sign in failed</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button type='submit' className='w-full' disabled={isLoading || oauthBusy}>
              {isLoading ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  Signing in…
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>

          <div className='mt-4 text-center text-sm'>
            Don&apos;t have an account?{' '}
            <Link href={registerHref} className='text-primary hover:underline'>
              Sign up
            </Link>
          </div>

          {oauthConfigured && (
            <>
              <div className='relative my-4'>
                <div className='absolute inset-0 flex items-center'>
                  <span className='w-full border-t' />
                </div>
                <div className='relative flex justify-center text-xs uppercase'>
                  <span className='bg-background px-2 text-muted-foreground'>Or continue with</span>
                </div>
              </div>

              <div
                className={
                  discordOAuthEnabled && googleOAuthEnabled
                    ? 'grid grid-cols-2 gap-4'
                    : 'grid grid-cols-1 gap-4'
                }
              >
                {googleOAuthEnabled && (
                  <Button
                    type='button'
                    variant='outline'
                    className='w-full border-[#dadce0]/70 bg-white text-gray-800 hover:bg-gray-50 hover:text-gray-900 dark:border-[#dadce0]/40 dark:bg-white/95 dark:hover:bg-white'
                    onClick={() => {
                      setOauthLoading('google')
                      void signIn('google', { callbackUrl: returnUrl })
                    }}
                    disabled={isLoading || oauthBusy}
                  >
                    {oauthLoading === 'google' ? (
                      <>
                        <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                        Google…
                      </>
                    ) : (
                      'Google'
                    )}
                  </Button>
                )}
                {discordOAuthEnabled && (
                  <Button
                    type='button'
                    variant='outline'
                    className='w-full border-[#5865F2]/40 bg-[#5865F2]/5 hover:bg-[#5865F2]/15 hover:text-foreground'
                    onClick={() => {
                      setOauthLoading('discord')
                      void signIn('discord', { callbackUrl: returnUrl })
                    }}
                    disabled={isLoading || oauthBusy}
                  >
                    {oauthLoading === 'discord' ? (
                      <>
                        <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                        Discord…
                      </>
                    ) : (
                      'Discord'
                    )}
                  </Button>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export function LoginForm(props: LoginFormProps) {
  return (
    <Suspense
      fallback={
        <div className='min-h-screen flex items-center justify-center bg-gradient-to-b from-purple-900 via-purple-800 to-gray-900 px-4'>
          <Card className='w-full max-w-md border-white/10 bg-background/95'>
            <CardHeader className='space-y-2'>
              <Skeleton className='h-8 w-48 mx-auto' />
              <Skeleton className='h-4 w-full' />
            </CardHeader>
            <CardContent className='space-y-4'>
              <Skeleton className='h-10 w-full' />
              <Skeleton className='h-10 w-full' />
              <Skeleton className='h-10 w-full' />
            </CardContent>
          </Card>
        </div>
      }
    >
      <LoginFormInner {...props} />
    </Suspense>
  )
}
