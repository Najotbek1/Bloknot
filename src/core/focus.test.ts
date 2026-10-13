import { describe, expect, it } from 'vitest'
import {
  endsAt,
  focusNotification,
  formatClock,
  isFinished,
  parseFocus,
  pauseFocus,
  remainingMs,
  resumeFocus,
  startFocus,
} from './focus'

const task = { id: 't1', title: 'Sport' }
const MIN = 60_000

describe('focus session', () => {
  it('counts down and finishes', () => {
    const session = startFocus(task, 25, 0)
    expect(remainingMs(session, 0)).toBe(25 * MIN)
    expect(remainingMs(session, 10 * MIN)).toBe(15 * MIN)
    expect(endsAt(session)).toBe(25 * MIN)
    expect(isFinished(session, 25 * MIN - 1)).toBe(false)
    expect(isFinished(session, 30 * MIN)).toBe(true)
    expect(remainingMs(session, 30 * MIN)).toBe(0)
  })

  it('does not count paused time', () => {
    let session = startFocus(task, 25, 0)
    session = pauseFocus(session, 5 * MIN)
    expect(endsAt(session)).toBeNull()
    expect(remainingMs(session, 60 * MIN)).toBe(20 * MIN)
    session = resumeFocus(session, 60 * MIN)
    expect(remainingMs(session, 70 * MIN)).toBe(10 * MIN)
    expect(endsAt(session)).toBe(80 * MIN)
    // Pausing twice or resuming a running session changes nothing.
    expect(resumeFocus(session, 71 * MIN)).toBe(session)
    const paused = pauseFocus(session, 72 * MIN)
    expect(pauseFocus(paused, 73 * MIN)).toBe(paused)
  })

  it('formats the clock and reads stored sessions safely', () => {
    expect(formatClock(25 * MIN)).toBe('25:00')
    expect(formatClock(61_500)).toBe('1:02')
    expect(formatClock(0)).toBe('0:00')
    const session = startFocus(task, 15, 1000, 'break')
    expect(parseFocus(JSON.stringify(session))).toEqual(session)
    expect(parseFocus('{"taskId":1}')).toBeNull()
    expect(parseFocus('not json')).toBeNull()
    expect(parseFocus(null)).toBeNull()
  })
})

describe('focusNotification', () => {
  it('rings at the end of a running session only', () => {
    const session = startFocus(task, 25, 0)
    expect(focusNotification(session, 0, 'Fokus tugadi')).toEqual({
      id: 99_999,
      at: new Date(25 * MIN),
      kind: 'focus',
      title: 'Fokus tugadi',
      body: 'Sport',
    })
    expect(focusNotification(pauseFocus(session, MIN), 2 * MIN, 'x')).toBeNull()
    expect(focusNotification(session, 26 * MIN, 'x')).toBeNull()
    expect(focusNotification(null, 0, 'x')).toBeNull()
  })
})
