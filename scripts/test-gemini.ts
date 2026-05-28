/**
 * Local diagnostic for Bracket Designer Gemini integration.
 * Run: npx tsx --env-file=.env scripts/test-gemini.ts
 */
import { isGeminiConfigured, generateGeminiText } from '../src/lib/ai/gemini'
import { getPlannerCoachInsight } from '../src/lib/ai/planner-coach'
import { recommendFormat } from '../src/lib/bracket-planner/recommend-format'

async function main() {
  console.log('GEMINI_API_KEY configured:', isGeminiConfigured())
  if (!isGeminiConfigured()) {
    console.error('Set GEMINI_API_KEY in .env (or pass --env-file=.env)')
    process.exit(1)
  }

  console.log('\n--- Minimal generateContent ---')
  try {
    const text = await generateGeminiText(
      'Reply in one short sentence.',
      'Say hello from the esports tournament planner test.',
    )
    console.log('OK:', text.slice(0, 200))
  } catch (error) {
    console.error('FAILED:', error instanceof Error ? error.message : error)
    if (error instanceof Error && error.stack) {
      console.error(error.stack.split('\n').slice(0, 5).join('\n'))
    }
    process.exit(1)
  }

  console.log('\n--- Full planner coach ---')
  const recommendation = recommendFormat(8, { schedule: 'multi_day', playStyle: 'balanced' })
  const coach = await getPlannerCoachInsight(recommendation, {
    schedule: 'multi_day',
    playStyle: 'balanced',
  })
  console.log('source:', coach.source)
  console.log('insight:', coach.insight.slice(0, 300) + (coach.insight.length > 300 ? '...' : ''))

  if (coach.source !== 'ai') {
    console.error('Expected source "ai" but got template — Gemini call likely failed silently earlier')
    process.exit(1)
  }

  console.log('\nAll checks passed.')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
