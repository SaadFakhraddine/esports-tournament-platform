import type { Page } from 'playwright'

/** Wait until the public tournaments grid has real cards (not skeleton placeholders). */
export async function waitForTournamentsBrowseLoaded(page: Page): Promise<void> {
  await page.getByText(/\d+ tournaments? found/i).waitFor({ timeout: 60_000 })
  await page
    .getByRole('link', { name: /Register Now|View Details|Watch Live/i })
    .first()
    .waitFor({ timeout: 30_000 })
  await page.waitForTimeout(500)
}

/** Wait until the public teams grid has real cards (not skeleton placeholders). */
export async function waitForTeamsBrowseLoaded(page: Page): Promise<void> {
  await page.getByRole('button', { name: /^View Team$/i }).first().waitFor({ timeout: 60_000 })
  await page.waitForTimeout(500)
}

/** Wait until /dashboard/stats has loaded KPIs and charts (not skeleton placeholders). */
export async function waitForPlayerStatsLoaded(page: Page): Promise<void> {
  await page.getByRole('heading', { name: /player stats/i }).waitFor({ timeout: 60_000 })

  const emptyState = page.getByRole('heading', { name: /no teams yet/i })
  const loaded = page.getByText('Match activity', { exact: true })

  await Promise.race([
    emptyState.waitFor({ timeout: 60_000 }),
    loaded.waitFor({ timeout: 60_000 }),
  ])

  if (await emptyState.isVisible().catch(() => false)) {
    throw new Error(
      'Player stats page has no teams — seed the demo DB (npm run db:seed) so player1@example.com has match history.',
    )
  }

  await page.getByText('Matches played', { exact: true }).waitFor({ timeout: 30_000 })
  await page.locator('[data-chart] .recharts-surface').first().waitFor({ timeout: 30_000 })
  await page.waitForTimeout(800)
}
