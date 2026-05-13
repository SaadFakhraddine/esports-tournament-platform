'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { Loader2, AlertCircle } from 'lucide-react'
import { trpc } from '@/lib/trpc/client'
import { validateRedirectUrl } from '@/lib/security/redirect-validation'

function RegisterForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const rawReturn = searchParams?.get('returnUrl')
  const returnUrl = validateRedirectUrl(rawReturn)

  const loginHref =
    rawReturn !== null && rawReturn !== ''
      ? `/login?returnUrl=${encodeURIComponent(returnUrl)}`
      : '/login'

  const registerMutation = trpc.user.register.useMutation()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const confirmPassword = formData.get('confirmPassword') as string
    const name = formData.get('name') as string
    const username = formData.get('username') as string

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setIsLoading(false)
      return
    }

    try {
      await registerMutation.mutateAsync({
        email,
        password,
        name,
        username: username && username.trim() !== '' ? username : undefined,
      })

      const qs = new URLSearchParams({ registered: 'true' })
      if (rawReturn !== null && rawReturn !== '') {
        qs.set('returnUrl', returnUrl)
      }
      router.push(`/login?${qs.toString()}`)
    } catch (err: unknown) {
      console.error('Registration error:', err)
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className='min-h-screen flex items-center justify-center bg-gradient-to-b from-purple-900 via-purple-800 to-gray-900 px-4'>
      <Card className='w-full max-w-md'>
        <CardHeader className='space-y-1'>
          <CardTitle className='text-2xl font-bold text-center'>Create Account</CardTitle>
          <CardDescription className='text-center'>Enter your information to get started</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='name'>Full Name</Label>
              <Input id='name' name='name' type='text' placeholder='John Doe' required disabled={isLoading} />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='username'>Username (Optional)</Label>
              <Input id='username' name='username' type='text' placeholder='johndoe' disabled={isLoading} />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='email'>Email</Label>
              <Input
                id='email'
                name='email'
                type='email'
                placeholder='john@example.com'
                required
                disabled={isLoading}
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
                minLength={8}
                disabled={isLoading}
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='confirmPassword'>Confirm Password</Label>
              <Input
                id='confirmPassword'
                name='confirmPassword'
                type='password'
                placeholder='••••••••'
                required
                minLength={8}
                disabled={isLoading}
              />
            </div>

            {error && (
              <Alert variant='destructive'>
                <AlertCircle className='h-4 w-4' />
                <AlertTitle>Could not register</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button type='submit' className='w-full' disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  Creating account…
                </>
              ) : (
                'Create Account'
              )}
            </Button>
          </form>

          <div className='mt-4 text-center text-sm'>
            Already have an account?{' '}
            <Link href={loginHref} className='text-primary hover:underline'>
              Sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className='min-h-screen flex items-center justify-center bg-gradient-to-b from-purple-900 via-purple-800 to-gray-900 px-4'>
          <Card className='w-full max-w-md border-white/10 bg-background/95'>
            <CardHeader className='space-y-2'>
              <Skeleton className='h-8 w-56 mx-auto' />
              <Skeleton className='h-4 w-full' />
            </CardHeader>
            <CardContent className='space-y-4'>
              <Skeleton className='h-10 w-full' />
              <Skeleton className='h-10 w-full' />
              <Skeleton className='h-10 w-full' />
              <Skeleton className='h-10 w-full' />
              <Skeleton className='h-10 w-full' />
            </CardContent>
          </Card>
        </div>
      }
    >
      <RegisterForm />
    </Suspense>
  )
}
