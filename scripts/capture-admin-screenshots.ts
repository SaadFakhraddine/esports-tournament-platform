/**
 * Admin portfolio shots (10–12). Stages audit data via UI, then captures.
 * Run: npm run screenshots:admin
 * Or: SCREENSHOT_BASE_URL=http://localhost:3000 npm run screenshots:admin
 */
import 'dotenv/config'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { chromium, type Page } from 'playwright'
import { LIVE_DEMO_URL } from '../docs/demo-site'
import { assertScreenshotBaseUrlReachable, screenshotSignIn } from './lib/screenshot-sign-in'

const baseUrl = process.env.SCREENSHOT_BASE_URL ?? LIVE_DEMO_URL
const outputDir = path.join(process.cwd(), 'docs', 'images')
const viewport = { width: 1400, height: 900 }
// Credentials match scripts/ensure-screenshot-users.ts
const email = 'admin@example.com'
const password = 'password123'

async function signIn(page: Page) {
  await screenshotSignIn(page, baseUrl, email, password)
  console.log(`Signed in as ${email}`)
}

async function stageAuditData(page: Page) {
  console.log('Staging admin actions for audit log…')
  await page.goto(new URL('/dashboard/admin/users', baseUrl).toString(), {
    waitUntil: 'domcontentloaded',
  })
  await page.getByRole('heading', { name: /^users$/i }).waitFor({ timeout: 30_000 })
  await page.waitForTimeout(1500)

  try {
    const search = page.getByPlaceholder(/search email/i)
    await search.fill('player2@example.com')
    await page.waitForTimeout(600)
    const row = page.locator('tr').filter({ hasText: 'player2@example.com' }).first()
    await row.getByRole('button', { name: 'Actions' }).click()
    await page.getByRole('menuitem', { name: 'Change role' }).hover()
    await page.getByRole('menuitem', { name: 'Make Organizer' }).click()
    await page.getByRole('button', { name: 'Change role' }).click()
    await page.waitForTimeout(1500)
    console.log('  Staged: role change for player2')
  } catch (error) {
    console.warn('  Skipped role change staging:', error)
  }

  try {
    const search = page.getByPlaceholder(/search email/i)
    await search.fill('player3@example.com')
    await page.waitForTimeout(600)
    const row = page.locator('tr').filter({ hasText: 'player3@example.com' }).first()
    const suspended = await row.getByText('Suspended').isVisible().catch(() => false)
    if (!suspended) {
      await row.getByRole('button', { name: 'Actions' }).click()
      await page.getByRole('menuitem', { name: 'Suspend account' }).click()
      await page.getByLabel(/reason/i).fill('Demo: policy violation')
      await page.getByRole('button', { name: 'Suspend account' }).click()
      await page.waitForTimeout(1500)
      console.log('  Staged: suspend player3')
    } else {
      console.log('  player3 already suspended')
    }
  } catch (error) {
    console.warn('  Skipped suspend staging:', error)
  }

  try {
    await page.goto(new URL('/dashboard/admin/games', baseUrl).toString(), {
      waitUntil: 'domcontentloaded',
    })
    await page.getByRole('heading', { name: /^games$/i }).waitFor({ timeout: 30_000 })
    await page.getByRole('button', { name: /add game/i }).click()
    await page.getByLabel(/^name$/i).fill('Rocket League')
    await page.getByRole('button', { name: /^add game$/i }).click()
    await page.waitForTimeout(1500)
    console.log('  Staged: add Rocket League game')
  } catch (error) {
    console.warn('  Skipped game staging (may already exist):', error)
  }
}

async function captureAdminPages(page: Page) {
  await page.goto(new URL('/dashboard/admin', baseUrl).toString(), {
    waitUntil: 'domcontentloaded',
  })
  await page.getByRole('heading', { name: /^overview$/i }).waitFor({ timeout: 30_000 })
  await page.waitForTimeout(2000)
  await page.screenshot({ path: path.join(outputDir, '10-admin-overview.png') })
  console.log('Saved 10-admin-overview.png')

  await page.goto(new URL('/dashboard/admin/users', baseUrl).toString(), {
    waitUntil: 'domcontentloaded',
  })
  await page.getByRole('heading', { name: /^users$/i }).waitFor({ timeout: 30_000 })
  await page.waitForTimeout(2000)
  await page.screenshot({ path: path.join(outputDir, '11-admin-users.png'), fullPage: true })
  console.log('Saved 11-admin-users.png')

  await page.goto(new URL('/dashboard/admin/audit', baseUrl).toString(), {
    waitUntil: 'domcontentloaded',
  })
  await page.getByRole('heading', { name: /audit log/i }).waitFor({ timeout: 30_000 })
  await page.waitForTimeout(2000)
  await page.screenshot({ path: path.join(outputDir, '12-admin-audit.png'), fullPage: true })
  console.log('Saved 12-admin-audit.png')
}

async function main() {
  await mkdir(outputDir, { recursive: true })
  await assertScreenshotBaseUrlReachable(baseUrl)
  console.log(`Capturing admin screenshots from ${baseUrl}`)
  console.log(`Output: ${outputDir}`)

  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport })

  await signIn(page)
  await stageAuditData(page)
  await captureAdminPages(page)

  await browser.close()
  console.log('Done.')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
