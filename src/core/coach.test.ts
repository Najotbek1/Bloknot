import { describe, expect, it } from 'vitest'
import { coachPhrase, coachTone } from './coach'

describe('coachTone', () => {
  it('is strict below 50, inspiring above 70, neutral otherwise', () => {
    expect(coachTone(49)).toBe('strict')
    expect(coachTone(50)).toBe('normal')
    expect(coachTone(70)).toBe('normal')
    expect(coachTone(71)).toBe('inspiring')
    expect(coachTone(null)).toBe('normal')
  })
})

describe('coachPhrase', () => {
  it('says nothing extra in the neutral tone', () => {
    expect(coachPhrase('normal', '2026-10-12')).toBeNull()
  })

  it('is stable for a day and slot, and varies between days', () => {
    expect(coachPhrase('strict', '2026-10-12')).toBe(coachPhrase('strict', '2026-10-12'))
    expect(coachPhrase('strict', '2026-10-12')).not.toBe(coachPhrase('strict', '2026-10-13'))
    expect(coachPhrase('inspiring', '2026-10-12', 1)).not.toBe(coachPhrase('inspiring', '2026-10-12', 0))
  })
})
