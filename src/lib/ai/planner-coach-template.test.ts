import { describe, expect, test } from 'vitest'
import { recommendFormat } from '@/lib/bracket-planner/recommend-format'
import { buildTemplateCoachInsight } from './planner-coach-template'

describe('buildTemplateCoachInsight', () => {
  test('mentions primary and alternative for 8 teams multi-day balanced', () => {
    const result = recommendFormat(8, {
      schedule: 'multi_day',
      playStyle: 'balanced',
    })
    const insight = buildTemplateCoachInsight(result, {
      schedule: 'multi_day',
      playStyle: 'balanced',
    })

    expect(insight).toContain('8 teams')
    expect(insight).toContain('multi-day')
    expect(insight).toMatch(/Swiss|Single elimination/i)
    expect(insight.length).toBeGreaterThan(80)
  })
})
