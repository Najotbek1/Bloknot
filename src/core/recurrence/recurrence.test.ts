import { describe, expect, it } from 'vitest'
import { occurrencesBetween, occursOn } from './index'

// 2026-10-05 is a Monday.
describe('daily recurrence', () => {
  it('repeats every day from the anchor', () => {
    const rule = { freq: 'daily', interval: 1 } as const
    expect(occurrencesBetween(rule, '2026-10-05', '2026-10-01', '2026-10-08')).toEqual([
      '2026-10-05',
      '2026-10-06',
      '2026-10-07',
      '2026-10-08',
    ])
  })

  it('repeats every N days', () => {
    const rule = { freq: 'daily', interval: 3 } as const
    expect(occurrencesBetween(rule, '2026-10-05', '2026-10-05', '2026-10-15')).toEqual([
      '2026-10-05',
      '2026-10-08',
      '2026-10-11',
      '2026-10-14',
    ])
  })

  it('never occurs before the anchor', () => {
    expect(occursOn({ freq: 'daily', interval: 1 }, '2026-10-05', '2026-10-04')).toBe(false)
  })

  it('stops after `until`', () => {
    const rule = { freq: 'daily', interval: 1, until: '2026-10-06' } as const
    expect(occurrencesBetween(rule, '2026-10-05', '2026-10-05', '2026-10-10')).toEqual([
      '2026-10-05',
      '2026-10-06',
    ])
  })
})

describe('weekly recurrence', () => {
  it('defaults to the anchor weekday', () => {
    const rule = { freq: 'weekly', interval: 1 } as const
    expect(occurrencesBetween(rule, '2026-10-05', '2026-10-05', '2026-10-26')).toEqual([
      '2026-10-05',
      '2026-10-12',
      '2026-10-19',
      '2026-10-26',
    ])
  })

  it('repeats on chosen weekdays', () => {
    const rule = { freq: 'weekly', interval: 1, weekdays: [1, 3, 5] } as const
    expect(occurrencesBetween(rule, '2026-10-05', '2026-10-05', '2026-10-11')).toEqual([
      '2026-10-05',
      '2026-10-07',
      '2026-10-09',
    ])
  })

  it('repeats every second week', () => {
    const rule = { freq: 'weekly', interval: 2, weekdays: [2] } as const
    // Anchor on Wednesday: the first Tuesday is the following week's, which is an "odd" week.
    expect(occurrencesBetween(rule, '2026-10-07', '2026-10-05', '2026-11-03')).toEqual([
      '2026-10-20',
      '2026-11-03',
    ])
  })
})

describe('monthly recurrence', () => {
  it('repeats on the anchor day of month', () => {
    const rule = { freq: 'monthly', interval: 1 } as const
    expect(occurrencesBetween(rule, '2026-10-15', '2026-10-01', '2027-01-31')).toEqual([
      '2026-10-15',
      '2026-11-15',
      '2026-12-15',
      '2027-01-15',
    ])
  })

  it('skips months that do not have the day', () => {
    const rule = { freq: 'monthly', interval: 1, monthDay: 31 } as const
    expect(occurrencesBetween(rule, '2026-10-01', '2026-10-01', '2027-01-31')).toEqual([
      '2026-10-31',
      '2026-12-31',
      '2027-01-31',
    ])
  })

  it('repeats every N months', () => {
    const rule = { freq: 'monthly', interval: 3, monthDay: 1 } as const
    expect(occurrencesBetween(rule, '2026-01-01', '2026-01-01', '2026-12-31')).toEqual([
      '2026-01-01',
      '2026-04-01',
      '2026-07-01',
      '2026-10-01',
    ])
  })
})
