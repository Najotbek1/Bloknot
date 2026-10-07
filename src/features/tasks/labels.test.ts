import { describe, expect, it } from 'vitest'
import { rangeElapsed, rangeHint, rangePhase, recurrenceSummary } from './labels'

describe('recurrenceSummary', () => {
  it('describes each kind of rule', () => {
    expect(recurrenceSummary({ freq: 'daily', interval: 1 }, '2026-10-05')).toBe('Har kuni')
    expect(recurrenceSummary({ freq: 'daily', interval: 3 }, '2026-10-05')).toBe('Har 3 kunda')
    expect(recurrenceSummary({ freq: 'weekly', interval: 1, weekdays: [5, 1] }, '2026-10-05')).toBe(
      'Har hafta: Du, Ju',
    )
    expect(recurrenceSummary({ freq: 'weekly', interval: 2 }, '2026-10-07')).toBe('Har 2 haftada: Ch')
    expect(recurrenceSummary({ freq: 'monthly', interval: 1 }, '2026-10-15')).toBe('Har oyning 15-kuni')
  })
})

describe('range helpers', () => {
  const task = { startDate: '2026-10-01', endDate: '2026-10-10' }

  it('knows the phase', () => {
    expect(rangePhase(task, '2026-09-30')).toBe('upcoming')
    expect(rangePhase(task, '2026-10-05')).toBe('active')
    expect(rangePhase(task, '2026-10-11')).toBe('finished')
  })

  it('gives a short hint', () => {
    expect(rangeHint(task, '2026-09-28')).toBe('3 kundan keyin boshlanadi')
    expect(rangeHint(task, '2026-10-05')).toBe('5 kun qoldi')
    expect(rangeHint(task, '2026-10-10')).toBe('Bugun oxirgi kun')
    expect(rangeHint(task, '2026-10-12')).toBe('Muddati o‘tgan')
  })

  it('measures elapsed time', () => {
    expect(rangeElapsed(task, '2026-09-01')).toBe(0)
    expect(rangeElapsed(task, '2026-10-05')).toBe(0.5)
    expect(rangeElapsed(task, '2026-12-01')).toBe(1)
  })
})
