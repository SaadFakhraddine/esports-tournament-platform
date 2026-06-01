/**
 * Player stats shot only (13 + public/images/dashboard-stats.png).
 */
import 'dotenv/config'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { chromium } from 'playwright'
import { LIVE_DEMO_URL } from '../docs/demo-site'
import { waitForPlayerStatsLoaded } from './lib/screenshot-browse'
import { assertScreenshotBaseUrlReachable, screenshotSignIn } from './lib/screenshot-sign-in'

const baseUrl = process.env.SCREENSHOT_BASE_URL ?? LIVE_DEMO_URL
const outputDir = path.join(process.cwd(), 'docs', 'images')
const email = process.env.E2E_EMAIL ?? 'player1@example.com'
const password = process.env.E2E_PASSWORD ?? 'password123'

async function main() {
  await mkdir(outputDir, { recursive: true })
  await mkdir(path.join(process.cwd(), 'public', 'images'), { recursive: true })
  await assertScreenshotBaseUrlReachable(baseUrl)

  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } })

  await screenshotSignIn(page, baseUrl, email, password)
  await page.goto(new URL('/dashboard/stats', baseUrl).toString(), {
    waitUntil: 'domcontentloaded',
  })
  await waitForPlayerStatsLoaded(page)

  await page.screenshot({
    path: path.join(outputDir, '13-player-stats.png'),
    fullPage: true,
  })
  console.log('Saved 13-player-stats.png')

  await page.screenshot({
    path: path.join(process.cwd(), 'public', 'images', 'dashboard-stats.png'),
    fullPage: true,
  })
  console.log('Saved public/images/dashboard-stats.png')

  await browser.close()
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
