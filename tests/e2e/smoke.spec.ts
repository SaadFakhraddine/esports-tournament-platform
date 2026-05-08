import { test, expect } from '@playwright/test'

test('landing page loads', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: /dominate/i })).toBeVisible()
  await expect(page.getByRole('link', { name: /explore/i })).toBeVisible()
})

test('tournaments page loads', async ({ page }) => {
  await page.goto('/tournaments')
  await expect(page.getByRole('heading', { name: /tournaments/i })).toBeVisible()
  await expect(page.getByPlaceholder('Search tournaments...')).toBeVisible()
})

test('teams page loads', async ({ page }) => {
  await page.goto('/teams')
  await expect(page.getByRole('heading', { name: /^teams$/i })).toBeVisible()
  await expect(page.getByRole('button', { name: /create team/i })).toBeVisible()
})

test('dashboard redirects to login when logged out', async ({ page }) => {
  await page.goto('/dashboard')
  await expect(page).toHaveURL(/\/login(\?|$)/)
  await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible()
})

