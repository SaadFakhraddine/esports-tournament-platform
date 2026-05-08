import { test, expect } from '@playwright/test'

test('user can sign in with seeded credentials', async ({ page }) => {
  const email = process.env.E2E_EMAIL
  const password = process.env.E2E_PASSWORD

  test.skip(
    !email || !password,
    'Set E2E_EMAIL and E2E_PASSWORD to run this test (avoids relying on local seed state).',
  )

  await page.goto('/login')
  await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible()

  await page.getByLabel('Email').fill(email!)
  await page.getByLabel('Password').fill(password!)
  await page.getByRole('button', { name: /^sign in$/i }).click()

  // Credentials sign-in does client-side navigation to returnUrl (defaults to /dashboard).
  await expect(page).toHaveURL(/\/dashboard(\?|$)/)

  // The dashboard shell should be present; this is a stable signal.
  await expect(page.getByRole('link', { name: /profile/i })).toBeVisible()
})

