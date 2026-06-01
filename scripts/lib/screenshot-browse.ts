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
