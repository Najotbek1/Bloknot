import { describe, expect, it } from 'vitest'
import { AdBlockers } from './blockers'

describe('AdBlockers', () => {
  it('blocks while any holder is active and notifies only on changes', () => {
    const blockers = new AdBlockers()
    const seen: boolean[] = []
    blockers.subscribe((blocked) => seen.push(blocked))

    const releaseSheet = blockers.push()
    const releaseKeyboard = blockers.push()
    expect(blockers.blocked).toBe(true)
    releaseSheet()
    expect(blockers.blocked).toBe(true)
    releaseKeyboard()
    expect(blockers.blocked).toBe(false)
    expect(seen).toEqual([true, false])
  })

  it('ignores a release called twice', () => {
    const blockers = new AdBlockers()
    const releaseA = blockers.push()
    const releaseB = blockers.push()
    releaseA()
    releaseA()
    expect(blockers.blocked).toBe(true)
    releaseB()
    expect(blockers.blocked).toBe(false)
  })
})
