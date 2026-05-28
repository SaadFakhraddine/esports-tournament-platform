/**
 * Organizer-only portfolio shots (08, 09). Use when production lacks admin@example.com.
 * Run: npx tsx --env-file=.env scripts/capture-organizer-screenshots.ts
 * Or: SCREENSHOT_BASE_URL=http://localhost:3000 npx tsx scripts/capture-organizer-screenshots.ts
 */
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { chromium } from 'playwright'

const baseUrl = process.env.SCREENSHOT_BASE_URL ?? 'http://localhost:3000'
const outputDir = path.join(process.cwd(), 'docs', 'images')
const email = process.env.E2E_ORGANIZER_EMAIL ?? 'admin@example.com'
const password = process.env.E2E_ORGANIZER_PASSWORD ?? 'password123'

async function main() {
  await mkdir(outputDir, { recursive: true })
  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } })

  console.log(`Signing in as ${email} at ${baseUrl}`)
  await page.goto(new URL('/login', baseUrl).toString(), { waitUntil: 'domcontentloaded' })
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password').fill(password)
  await page.getByRole('button', { name: /^sign in$/i }).click()
  await page.waitForURL(/\/dashboard/, { timeout: 60_000 })
  await page.waitForTimeout(2000)

  await page.goto(new URL('/dashboard/tournaments', baseUrl).toString(), {
    waitUntil: 'domcontentloaded',
  })
  await page.waitForTimeout(3000)
  await page.screenshot({ path: path.join(outputDir, '08-my-tournaments.png'), fullPage: true })
  console.log('Saved 08-my-tournaments.png')

  await page.goto(new URL('/dashboard/tournaments/planner', baseUrl).toString(), {
    waitUntil: 'domcontentloaded',
  })
  await page.getByRole('heading', { name: /bracket designer/i }).waitFor({ timeout: 30_000 })
  await page.getByText('Recommendations').waitFor({ timeout: 30_000 })
  await page.getByText(/planner insight/i).waitFor({ timeout: 30_000 }).catch(() => undefined)
  await page.waitForTimeout(4000)
  await page.screenshot({ path: path.join(outputDir, '09-bracket-designer.png'), fullPage: true })
  console.log('Saved 09-bracket-designer.png')

  await browser.close()
  console.log('Done.')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
