import { describe, expect, test, vi, beforeEach, afterEach } from 'vitest'
import { recommendFormat } from '@/lib/bracket-planner/recommend-format'
import { getPlannerCoachInsight } from './planner-coach'
import * as gemini from './gemini'

describe('getPlannerCoachInsight', () => {
  const sampleConstraints = { schedule: 'multi_day' as const, playStyle: 'balanced' as const }
  const sampleResult = recommendFormat(8, sampleConstraints)

  beforeEach(() => {
    vi.restoreAllMocks()
  })

  afterEach(() => {
    delete process.env.GEMINI_API_KEY
  })

  test('uses template when Gemini is not configured', async () => {
    vi.spyOn(gemini, 'isGeminiConfigured').mockReturnValue(false)

    const result = await getPlannerCoachInsight(sampleResult, sampleConstraints)

    expect(result.source).toBe('template')
    expect(result.insight).toContain('8 teams')
  })

  test('uses AI when Gemini returns text', async () => {
    vi.spyOn(gemini, 'isGeminiConfigured').mockReturnValue(true)
    vi.spyOn(gemini, 'generateGeminiText').mockResolvedValue(
      'Swiss fits your weekend event well because every team plays several matches without early elimination. ' +
        'Single elimination is faster if you only have one afternoon and want a quick champion.',
    )

    const result = await getPlannerCoachInsight(sampleResult, sampleConstraints)

    expect(result.source).toBe('ai')
    expect(result.insight).toContain('Swiss')
  })

  test('falls back to template when Gemini throws', async () => {
    vi.spyOn(gemini, 'isGeminiConfigured').mockReturnValue(true)
    vi.spyOn(gemini, 'generateGeminiText').mockRejectedValue(new Error('API error'))

    const result = await getPlannerCoachInsight(sampleResult, sampleConstraints)

    expect(result.source).toBe('template')
    expect(result.insight).toContain('8 teams')
  })
})
