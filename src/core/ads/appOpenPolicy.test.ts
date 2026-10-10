import { describe, expect, it } from 'vitest'
import { shouldShowAppOpen, type AppOpenState } from './appOpenPolicy'

const at = (day: number, hours: number, minutes = 0) => new Date(2026, 9, day, hours, minutes).getTime()
const base: AppOpenState = {
  now: at(20, 9),
  installedAt: at(10, 8),
  lastShownAt: null,
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

  it('shows at most once per calendar day', () => {
    expect(shouldShowAppOpen({ ...base, lastShownAt: at(20, 7) })).toBe(false)
    expect(shouldShowAppOpen({ ...base, lastShownAt: at(19, 23) })).toBe(true)
  })

  it('on resume, only after half an hour away', () => {
    expect(shouldShowAppOpen({ ...base, trigger: 'resume', backgroundSince: at(20, 8, 45) })).toBe(false)
    expect(shouldShowAppOpen({ ...base, trigger: 'resume', backgroundSince: at(20, 8, 20) })).toBe(true)
    expect(shouldShowAppOpen({ ...base, trigger: 'resume', backgroundSince: null })).toBe(false)
  })

  it('in test mode, skips the install wait and allows one every two minutes', () => {
    const test = { ...base, testMode: true, installedAt: at(20, 8, 59) }
    expect(shouldShowAppOpen(test)).toBe(true)
    expect(shouldShowAppOpen({ ...test, lastShownAt: at(20, 8, 59) })).toBe(false)
    expect(shouldShowAppOpen({ ...test, lastShownAt: at(20, 8, 57) })).toBe(true)
    expect(shouldShowAppOpen({ ...test, trigger: 'resume', backgroundSince: at(20, 8, 59) })).toBe(false)
  })
})
