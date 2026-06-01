import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { chromium, type Page } from 'playwright'
import { LIVE_DEMO_URL } from '../docs/demo-site'

const baseUrl = process.env.SCREENSHOT_BASE_URL ?? LIVE_DEMO_URL
const outputDir = path.join(process.cwd(), 'docs', 'images')
const viewport = { width: 1400, height: 900 }

const playerEmail = process.env.E2E_EMAIL ?? 'player1@example.com'
const playerPassword = process.env.E2E_PASSWORD ?? 'password123'
const organizerEmail = process.env.E2E_ORGANIZER_EMAIL ?? 'admin@example.com'
const organizerPassword = process.env.E2E_ORGANIZER_PASSWORD ?? 'password123'

async function signIn(page: Page, email: string, password: string) {
  await page.goto(new URL('/login', baseUrl).toString(), { waitUntil: 'domcontentloaded' })
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password').fill(password)
  await page.getByRole('button', { name: /^sign in$/i }).click()
  await page.waitForURL(/\/dashboard(\?|$)/, { timeout: 60_000 })
  await page.waitForTimeout(2000)
}

async function capturePublicPages() {
  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport })

  const routes = [
    { file: '01-landing.png', url: '/', fullPage: false, waitMs: 4000 },
    { file: '02-tournaments.png', url: '/tournaments', fullPage: true, waitMs: 4000 },
    { file: '03-teams.png', url: '/teams', fullPage: true, waitMs: 4000 },
    { file: '04-login.png', url: '/login', fullPage: false, waitMs: 3000 },
    { file: '05-register.png', url: '/register', fullPage: false, waitMs: 3000 },
  ] as const

  for (const route of routes) {
    await page.goto(new URL(route.url, baseUrl).toString(), { waitUntil: 'networkidle' })
    await page.waitForTimeout(route.waitMs)
    await page.screenshot({
      path: path.join(outputDir, route.file),
      fullPage: route.fullPage,
    })
    console.log(`Saved ${route.file}`)
  }

  await browser.close()
}

async function capturePlayerDashboard() {
  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport })

  await signIn(page, playerEmail, playerPassword)

  await page.goto(new URL('/dashboard', baseUrl).toString(), { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(2500)
  await page.screenshot({ path: path.join(outputDir, '06-dashboard.png') })
  console.log('Saved 06-dashboard.png')

  await page.goto(new URL('/dashboard/stats', baseUrl).toString(), {
    waitUntil: 'domcontentloaded',
  })
  await page.getByRole('heading', { name: /player stats/i }).waitFor({ timeout: 30_000 })
  await page.waitForTimeout(4000)
  const statsShot = path.join(outputDir, '13-player-stats.png')
  await page.screenshot({ path: statsShot, fullPage: true })
  console.log('Saved 13-player-stats.png')
  await page.screenshot({
    path: path.join(process.cwd(), 'public', 'images', 'dashboard-stats.png'),
    fullPage: true,
  })
  console.log('Saved public/images/dashboard-stats.png')

  await browser.close()
}

async function captureTournamentDetailWithBracket() {
  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport })

  await page.goto(new URL('/tournaments', baseUrl).toString(), { waitUntil: 'networkidle' })
  await page.waitForTimeout(2000)

  const tournamentLink = page.locator('a[href^="/tournaments/"]').first()
  await tournamentLink.waitFor({ timeout: 20_000 })
  const href = await tournamentLink.getAttribute('href')
  if (!href) {
    throw new Error('No tournament detail link found on /tournaments')
  }

  await page.goto(new URL(href, baseUrl).toString(), { waitUntil: 'networkidle' })
  await page.waitForTimeout(2000)

  const bracketTab = page.getByRole('tab', { name: /^bracket$/i })
  if (await bracketTab.isVisible().catch(() => false)) {
    await bracketTab.click()
    await page.waitForTimeout(3500)
  }

  await page.screenshot({
    path: path.join(outputDir, '07-tournament-detail.png'),
    fullPage: true,
  })
  console.log('Saved 07-tournament-detail.png')

  await browser.close()
}

async function captureOrganizerPages() {
  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport })

  await signIn(page, organizerEmail, organizerPassword)

  await page.goto(new URL('/dashboard/tournaments', baseUrl).toString(), {
    waitUntil: 'networkidle',
  })
  await page.waitForTimeout(2500)
  await page.screenshot({
    path: path.join(outputDir, '08-my-tournaments.png'),
    fullPage: true,
  })
  console.log('Saved 08-my-tournaments.png')

  await page.goto(new URL('/dashboard/tournaments/planner', baseUrl).toString(), {
    waitUntil: 'networkidle',
  })
  await page.getByRole('heading', { name: /bracket designer/i }).waitFor({ timeout: 20_000 })
  await page.getByText('Recommendations').waitFor({ timeout: 20_000 })
  // Allow recommend + explainPlanner queries to finish (AI insight block)
  await page
    .getByText(/planner insight/i)
    .waitFor({ timeout: 25_000 })
    .catch(() => undefined)
  await page.waitForTimeout(3000)
  await page.screenshot({
    path: path.join(outputDir, '09-bracket-designer.png'),
    fullPage: true,
  })
  console.log('Saved 09-bracket-designer.png')

  await browser.close()
}

async function main() {
  await mkdir(outputDir, { recursive: true })
  console.log(`Capturing portfolio screenshots from ${baseUrl}`)
  console.log(`Output: ${outputDir}`)

  await capturePublicPages()

  try {
    await capturePlayerDashboard()
  } catch (error) {
    console.warn('Player dashboard capture failed:', error)
  }

  try {
    await captureTournamentDetailWithBracket()
  } catch (error) {
    console.warn('Tournament detail capture failed:', error)
  }

  try {
    await captureOrganizerPages()
  } catch (error) {
    console.warn('Organizer captures failed (need admin@example.com on demo DB):', error)
  }

  console.log('Done.')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
