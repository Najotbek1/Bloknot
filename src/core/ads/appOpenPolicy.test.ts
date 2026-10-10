import { describe, expect, it } from 'vitest'
import { recordShown, shouldShowAppOpen, type AppOpenState } from './appOpenPolicy'

const at = (day: number, hours: number, minutes = 0) => new Date(2026, 9, day, hours, minutes).getTime()
const base: AppOpenState = {
  now: at(20, 9),
  installedAt: at(10, 8),
  shownAt: [],
  trigger: 'cold',
  backgroundSince: null,
  testMode: false,
}

describe('shouldShowAppOpen', () => {
  it('shows on a fresh start once the app is a few days old', () => {
    expect(shouldShowAppOpen(base)).toBe(true)
    expect(shouldShowAppOpen({ ...base, installedAt: at(18, 10) })).toBe(false)
    expect(shouldShowAppOpen({ ...base, installedAt: at(17, 9) })).toBe(true)
  })

  it('shows up to five times a day, an hour apart', () => {
    const four = [at(20, 0, 10), at(20, 3), at(20, 5), at(20, 7)]
    expect(shouldShowAppOpen({ ...base, shownAt: four })).toBe(true)
    expect(shouldShowAppOpen({ ...base, shownAt: [...four, at(20, 7, 30)] })).toBe(false)
    expect(shouldShowAppOpen({ ...base, shownAt: [at(20, 8, 30)] })).toBe(false) // only 30 minutes ago
    // Yesterday's five do not count today.
    const yesterday = [at(19, 9), at(19, 11), at(19, 13), at(19, 15), at(19, 17)]
    expect(shouldShowAppOpen({ ...base, shownAt: yesterday })).toBe(true)
  })

  it('on resume, only after half an hour away', () => {
    expect(shouldShowAppOpen({ ...base, trigger: 'resume', backgroundSince: at(20, 8, 45) })).toBe(false)
    expect(shouldShowAppOpen({ ...base, trigger: 'resume', backgroundSince: at(20, 8, 20) })).toBe(true)
    expect(shouldShowAppOpen({ ...base, trigger: 'resume', backgroundSince: null })).toBe(false)
  })

  it('in test mode, skips the install wait and allows one every two minutes', () => {
    const test = { ...base, testMode: true, installedAt: at(20, 8, 59) }
    expect(shouldShowAppOpen(test)).toBe(true)
    expect(shouldShowAppOpen({ ...test, shownAt: [at(20, 8, 59)] })).toBe(false)
    expect(shouldShowAppOpen({ ...test, shownAt: [at(20, 8, 57)] })).toBe(true)
    expect(shouldShowAppOpen({ ...test, trigger: 'resume', backgroundSince: at(20, 8, 59) })).toBe(false)
  })
})

describe('recordShown', () => {
  it('keeps only today’s times and adds the new one', () => {
    expect(recordShown([at(19, 22), at(20, 7)], at(20, 9))).toEqual([at(20, 7), at(20, 9)])
  })
})
