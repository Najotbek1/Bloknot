import { describe, expect, it } from 'vitest'
import {
  addDays,
  isDateInRange,
  monthKeyOf,
  shiftMonth,
  parseDateKey,
  toDateKey,
  weekStartOf,
  weekdayOf,
} from './dates'

describe('date keys', () => {
  it('round-trips a date', () => {
    expect(toDateKey(parseDateKey('2026-10-07'))).toBe('2026-10-07')
  })

  it('rejects invalid keys', () => {
    expect(() => parseDateKey('2026-02-30')).toThrow()
    expect(() => parseDateKey('07.10.2026')).toThrow()
  })
})

describe('weekStartOf', () => {
  it('returns Monday for any day of the week', () => {
    expect(weekStartOf('2026-10-05')).toBe('2026-10-05') // Monday
    expect(weekStartOf('2026-10-07')).toBe('2026-10-05') // Wednesday
    expect(weekStartOf('2026-10-11')).toBe('2026-10-05') // Sunday
  })

  it('crosses month and year boundaries', () => {
    expect(weekStartOf('2027-01-01')).toBe('2026-12-28')
  })
})

describe('weekdayOf', () => {
  it('uses 1 = Monday and 7 = Sunday', () => {
    expect(weekdayOf('2026-10-05')).toBe(1)
    expect(weekdayOf('2026-10-11')).toBe(7)
  })
})

describe('addDays', () => {
  it('handles month ends and leap years', () => {
    expect(addDays('2026-01-31', 1)).toBe('2026-02-01')
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29')
    expect(addDays('2027-02-28', 1)).toBe('2027-03-01')
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28')
  })
})

describe('monthKeyOf', () => {
  it('returns YYYY-MM', () => {
    expect(monthKeyOf('2026-10-07')).toBe('2026-10')
  })
})

describe('isDateInRange', () => {
  it('is inclusive on both ends', () => {
    expect(isDateInRange('2026-10-01', '2026-10-01', '2026-10-31')).toBe(true)
    expect(isDateInRange('2026-10-31', '2026-10-01', '2026-10-31')).toBe(true)
    expect(isDateInRange('2026-11-01', '2026-10-01', '2026-10-31')).toBe(false)
    expect(isDateInRange('2026-09-30', '2026-10-01', '2026-10-31')).toBe(false)
  })
})

describe('shiftMonth', () => {
  it('returns the first day of the month before or after', () => {
    expect(shiftMonth('2026-10', 1)).toBe('2026-11-01')
    expect(shiftMonth('2026-01', -1)).toBe('2025-12-01')
  })
})
