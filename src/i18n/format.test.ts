import { describe, expect, it } from 'vitest'
import { formatDayLong, formatDayShort, formatMonth, formatRange, formatUpdated, formatWeek } from './format'

describe('Uzbek date formatting', () => {
  it('formats days', () => {
    expect(formatDayShort('2026-10-07')).toBe('7-oktabr')
    expect(formatDayShort('2027-01-03', 2026)).toBe('3-yanvar, 2027')
    expect(formatDayLong('2026-10-07')).toBe('Chorshanba, 7-oktabr')
  })

  it('formats months', () => {
    expect(formatMonth('2026-10')).toBe('Oktabr 2026')
  })

  it('formats weeks within and across months', () => {
    expect(formatWeek('2026-10-05')).toBe('5–11-oktabr')
    expect(formatWeek('2026-12-28')).toBe('28-dekabr – 3-yanvar')
  })

  it('formats ranges, adding the year only when it changes', () => {
    expect(formatRange('2026-10-01', '2026-12-31')).toBe('1-oktabr – 31-dekabr')
    expect(formatRange('2026-10-01', '2027-02-01')).toBe('1-oktabr – 1-fevral, 2027')
  })
})

describe('formatUpdated', () => {
  const now = new Date(2026, 9, 8, 18, 0)
  it('says today or yesterday with the time, otherwise the date', () => {
    expect(formatUpdated(new Date(2026, 9, 8, 9, 5).getTime(), now)).toBe('bugun 09:05')
    expect(formatUpdated(new Date(2026, 9, 7, 21, 30).getTime(), now)).toBe('kecha 21:30')
    expect(formatUpdated(new Date(2026, 9, 1, 12, 0).getTime(), now)).toBe('1-oktabr')
    expect(formatUpdated(new Date(2025, 11, 31, 12, 0).getTime(), now)).toBe('31-dekabr, 2025')
  })
})
