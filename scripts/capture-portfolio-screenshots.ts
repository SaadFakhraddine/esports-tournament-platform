import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { chromium } from 'playwright'
import { LIVE_DEMO_URL } from '../docs/demo-site'

const outputDir = path.join(process.cwd(), 'docs', 'images')
const viewport = { width: 1400, height: 900 }

const email = process.env.E2E_EMAIL ?? 'player1@example.com'
const password = process.env.E2E_PASSWORD ?? 'password123'

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
    await page.goto(new URL(route.url, LIVE_DEMO_URL).toString(), { waitUntil: 'networkidle' })
    await page.waitForTimeout(route.waitMs)
    await page.screenshot({
      path: path.join(outputDir, route.file),
      fullPage: route.fullPage,
    })
    console.log(`Saved ${route.file}`)
  }

  await browser.close()
}

async function captureAuthenticatedPages() {
  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport })

  await page.goto(new URL('/login', LIVE_DEMO_URL).toString(), { waitUntil: 'networkidle' })
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password').fill(password)
  await page.getByRole('button', { name: /^sign in$/i }).click()
  await page.waitForURL(/\/dashboard(\?|$)/, { timeout: 45_000 })

  await page.waitForTimeout(2000)
  await page.screenshot({ path: path.join(outputDir, '06-dashboard.png') })
  console.log('Saved 06-dashboard.png')

  await page.goto(new URL('/tournaments', LIVE_DEMO_URL).toString(), { waitUntil: 'networkidle' })
  await page.waitForTimeout(2000)
  const tournamentLink = page.locator('a[href^="/tournaments/"]').first()
  await tournamentLink.waitFor({ timeout: 20_000 })
  const href = await tournamentLink.getAttribute('href')
  if (!href) {
    throw new Error('No tournament detail link found on /tournaments')
  }

  await page.goto(new URL(href, LIVE_DEMO_URL).toString(), { waitUntil: 'networkidle' })
  await page.waitForTimeout(3000)
  await page.screenshot({ path: path.join(outputDir, '07-tournament-detail.png'), fullPage: true })
  console.log('Saved 07-tournament-detail.png')

  await browser.close()
}

async function captureTournamentDetailPublic() {
  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport })

  await page.goto(new URL('/tournaments', LIVE_DEMO_URL).toString(), { waitUntil: 'networkidle' })
  await page.waitForTimeout(2000)
  const tournamentLink = page.locator('a[href^="/tournaments/"]').first()
  await tournamentLink.waitFor({ timeout: 20_000 })
  const href = await tournamentLink.getAttribute('href')
  if (!href) {
    throw new Error('No tournament detail link found on /tournaments')
  }

  await page.goto(new URL(href, LIVE_DEMO_URL).toString(), { waitUntil: 'networkidle' })
  await page.waitForTimeout(3000)
  await page.screenshot({ path: path.join(outputDir, '07-tournament-detail.png'), fullPage: true })
  console.log('Saved 07-tournament-detail.png')

  await browser.close()
}

async function main() {
  await mkdir(outputDir, { recursive: true })
  console.log(`Capturing portfolio screenshots from ${LIVE_DEMO_URL}`)
  await capturePublicPages()
  try {
    await captureAuthenticatedPages()
  } catch (error) {
    console.warn('Authenticated captures failed; saving public tournament detail only.', error)
    await captureTournamentDetailPublic()
  }
  console.log('Done.')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
