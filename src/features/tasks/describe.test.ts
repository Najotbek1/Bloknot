import { describe, expect, it } from 'vitest'
import { describeTaskPlace } from './describe'

const empty = { date: null, weekStart: null, month: null, startDate: null, endDate: null }

describe('describeTaskPlace', () => {
  it('names the day, week, month or range and the kind', () => {
    expect(describeTaskPlace({ ...empty, kind: 'daily', date: '2026-10-08' })).toBe('8-oktabr, Kunlik')
    expect(describeTaskPlace({ ...empty, kind: 'weekly', weekStart: '2026-10-05' })).toBe('5–11-oktabr, Haftalik')
    expect(describeTaskPlace({ ...empty, kind: 'monthly', month: '2026-10' })).toBe('Oktabr 2026, Oylik')
    expect(
      describeTaskPlace({ ...empty, kind: 'range', startDate: '2026-10-01', endDate: '2026-10-20' }),
    ).toBe('1-oktabr – 20-oktabr, Muddatli')
    expect(describeTaskPlace({ ...empty, kind: 'general' })).toBe('Umumiy')
  })
})
