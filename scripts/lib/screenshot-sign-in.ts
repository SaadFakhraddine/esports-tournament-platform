import type { BrowserContext, Page } from 'playwright'

const HEALTH_TIMEOUT_MS = 15_000

/** Fail fast when the target host is down or stuck (e.g. zombie process on :3000). */
export async function assertScreenshotBaseUrlReachable(baseUrl: string): Promise<void> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), HEALTH_TIMEOUT_MS)
  try {
    const res = await fetch(new URL('/api/auth/csrf', baseUrl).toString(), {
      signal: controller.signal,
    })
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`)
    }
  } catch (error) {
    const hint =
      baseUrl.includes('localhost')
        ? ' Stop other dev servers, kill anything on that port, then run `npm run dev` and set SCREENSHOT_BASE_URL to the port Next prints.'
        : ' Check the deployment is up and DATABASE_URL on Vercel is valid.'
    throw new Error(
      `Cannot reach ${baseUrl} for screenshots (${error instanceof Error ? error.message : error}).${hint}`,
    )
  } finally {
    clearTimeout(timer)
  }
}

/**
 * Sign in via Auth.js credentials API (same cookies as the browser UI).
 * Avoids React hydration races that cause native GET submits on /login.
 */
export async function screenshotSignIn(
  page: Page,
  baseUrl: string,
  email: string,
  password: string,
): Promise<void> {
  const context = page.context()
  await signInWithAuthApi(context, baseUrl, email, password)

  await page.goto(new URL('/dashboard', baseUrl).toString(), {
    waitUntil: 'domcontentloaded',
    timeout: 60_000,
  })

  if (/\/login(\?|$)/.test(page.url())) {
    const alert = await page.locator('[role=alert]').textContent().catch(() => null)
    throw new Error(
      `Session not established for ${email}${alert ? `: ${alert.trim()}` : ''}. ` +
        'Run `npm run db:seed` or `npx tsx scripts/ensure-screenshot-users.ts` and unsuspend the account.',
    )
  }

  await page.waitForTimeout(1500)
}

async function signInWithAuthApi(
  context: BrowserContext,
  baseUrl: string,
  email: string,
  password: string,
): Promise<void> {
  const origin = baseUrl.replace(/\/$/, '')
  const csrfRes = await context.request.get(`${origin}/api/auth/csrf`, { timeout: 30_000 })
  if (!csrfRes.ok()) {
    throw new Error(`CSRF request failed: HTTP ${csrfRes.status()}`)
  }

  const { csrfToken } = (await csrfRes.json()) as { csrfToken: string }
  const loginRes = await context.request.post(`${origin}/api/auth/callback/credentials`, {
    form: {
      email,
      password,
      csrfToken,
      callbackUrl: `${origin}/dashboard`,
      redirect: 'false',
      json: 'true',
    },
    timeout: 60_000,
  })

  const cookies = await context.cookies(origin)
  const hasSession = cookies.some((c) => c.name.includes('session-token'))
  if (!hasSession) {
    const body = await loginRes.text()
    const configError =
      body.includes('error=Configuration') || body.includes('"error":"Configuration"')
    if (configError) {
      throw new Error(
        'Auth Configuration error — the running app cannot connect to the database. ' +
          'Restart `npm run dev` after fixing DATABASE_URL in .env (use the Supabase pooler URL with pgbouncer=true).',
      )
    }
    const suspended =
      body.includes('AccountSuspended') || body.includes('error=AccountSuspended')
    if (suspended) {
      throw new Error(`Account suspended: ${email}. Unsuspend in admin or re-run ensure-screenshot-users.`)
    }
    throw new Error(
      `Credentials sign-in failed for ${email} (HTTP ${loginRes.status()}). ` +
        'Run `npx tsx scripts/ensure-screenshot-users.ts`.',
    )
  }
}
