import { describe, expect, it } from 'vitest'
import { formatMessage } from './plural'

describe('formatMessage', () => {
  it('fills plain placeholders and leaves unknown ones', () => {
    expect(formatMessage('{done} / {total} {x}', { done: 1, total: 3 }, 'en')).toBe('1 / 3 {x}')
  })

  it('picks plural forms by language', () => {
    const en = '{count, plural, one {# plan} other {# plans}} left'
    expect(formatMessage(en, { count: 1 }, 'en')).toBe('1 plan left')
    expect(formatMessage(en, { count: 4 }, 'en')).toBe('4 plans left')
    const ru = '{count, plural, one {# задача} few {# задачи} many {# задач} other {# задачи}}'
    expect([1, 3, 5, 21].map((count) => formatMessage(ru, { count }, 'ru'))).toEqual([
      '1 задача',
      '3 задачи',
      '5 задач',
      '21 задача',
    ])
  })

  it('supports exact matches and other placeholders inside forms', () => {
    const text = '{count, plural, =0 {No plans for {day}} other {# plans for {day}}}'
    expect(formatMessage(text, { count: 0, day: 'Mon' }, 'en')).toBe('No plans for Mon')
    expect(formatMessage(text, { count: 2, day: 'Mon' }, 'en')).toBe('2 plans for Mon')
  })
})
