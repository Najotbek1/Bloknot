import { describe, expect, it } from 'vitest'
import { nextStatus } from './status'

describe('nextStatus', () => {
  it('with one-tap done: open → done → todo', () => {
    expect(nextStatus('todo', true)).toBe('done')
    expect(nextStatus('in_progress', true)).toBe('done')
    expect(nextStatus('skipped', true)).toBe('done')
    expect(nextStatus('done', true)).toBe('todo')
  })

  it('without it: todo → in progress → done → todo', () => {
    expect(nextStatus('todo', false)).toBe('in_progress')
    expect(nextStatus('skipped', false)).toBe('in_progress')
    expect(nextStatus('in_progress', false)).toBe('done')
    expect(nextStatus('done', false)).toBe('todo')
  })
})
