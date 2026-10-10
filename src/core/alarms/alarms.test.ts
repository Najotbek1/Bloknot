import { describe, expect, it } from 'vitest'
import { createAlarm, deleteAlarm, listAlarms, updateAlarm } from '../db/alarms'
import { createTestDb } from '../db/testing'
import type { Alarm } from '../models/types'
import { challengeTexts, correctPrefixLength, matchesChallenge, normalizeTyped, pickChallenge } from './challenge'
import { MAX_PLANNED_ALARMS, nextAlarm, nextRings, planAlarms } from './schedule'

const alarm = (fields: Partial<Alarm>): Alarm => ({
  id: fields.id ?? crypto.randomUUID(),
  time: '06:30',
  weekdays: [],
  enabled: true,
  label: '',
  textLength: 'short',
  ringtoneUri: null,
  ringtoneTitle: null,
  createdAt: 0,
  updatedAt: 0,
  deletedAt: null,
  ...fields,
})
// Saturday 2026-10-10.
const at = (day: number, hours: number, minutes = 0) => new Date(2026, 9, day, hours, minutes)
const show = (dates: Date[]) => dates.map((d) => `${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`)

describe('nextRings', () => {
  it('rings a one-time alarm once, today if still ahead, otherwise tomorrow', () => {
    expect(show(nextRings(alarm({}), at(10, 5)))).toEqual(['10 6:30'])
    expect(show(nextRings(alarm({}), at(10, 6, 30)))).toEqual(['11 6:30'])
  })

  it('rings repeating alarms on their weekdays only', () => {
    // Weekdays Mon–Fri; from Saturday the next rings are Mon 12 … Fri 16.
    const workdays = alarm({ weekdays: [1, 2, 3, 4, 5] })
    expect(show(nextRings(workdays, at(10, 12)))).toEqual(['12 6:30', '13 6:30', '14 6:30', '15 6:30', '16 6:30'])
  })

  it('skips disabled and deleted alarms', () => {
    expect(nextRings(alarm({ enabled: false }), at(10, 5))).toEqual([])
    expect(nextRings(alarm({ deletedAt: 1 }), at(10, 5))).toEqual([])
  })
})

describe('planAlarms', () => {
  it('merges all alarms soonest first with ids from 1', () => {
    const plan = planAlarms([alarm({ id: 'b', time: '07:00' }), alarm({ id: 'a', time: '06:00', label: 'Sport' })], at(10, 5))
    expect(plan.map((p) => [p.nativeId, p.alarmId, p.label])).toEqual([
      [1, 'a', 'Sport'],
      [2, 'b', ''],
    ])
  })

  it('keeps at most the maximum', () => {
    const many = Array.from({ length: 12 }, (_, i) => alarm({ time: `0${i % 10}:0${i % 6}`, weekdays: [1, 2, 3, 4, 5, 6, 7] }))
    expect(planAlarms(many, at(10, 5))).toHaveLength(MAX_PLANNED_ALARMS)
  })

  it('finds the next alarm for the Today screen', () => {
    const next = nextAlarm([alarm({ time: '08:00' }), alarm({ time: '07:00', enabled: false })], at(10, 9))
    expect(next && show([next.at])).toEqual(['11 8:00'])
    expect(nextAlarm([], at(10, 9))).toBeNull()
  })
})

describe('typing challenge', () => {
  it('has eight texts per length, longer ones longer', () => {
    const words = (texts: string[]) => Math.min(...texts.map((t) => t.split(/\s+/).length))
    expect(challengeTexts('short')).toHaveLength(8)
    expect(words(challengeTexts('medium'))).toBeGreaterThan(Math.max(...challengeTexts('short').map((t) => t.split(/\s+/).length)))
    expect(words(challengeTexts('long'))).toBeGreaterThanOrEqual(30)
  })

  it('picks the same text for the same ringing', () => {
    expect(pickChallenge('short', 123456)).toBe(pickChallenge('short', 123456))
    expect(challengeTexts('long')).toContain(pickChallenge('long', 7))
  })

  it('ignores case, punctuation, apostrophe style and extra spaces', () => {
    const target = 'Men uyg‘ondim va kunni boshlashga tayyorman.'
    expect(normalizeTyped(target)).toBe('men uygondim va kunni boshlashga tayyorman')
    expect(matchesChallenge("men uyg'ondim  va kunni boshlashga TAYYORMAN", target)).toBe(true)
    expect(matchesChallenge('men uygondim va kunni boshlashga tayyorman', target)).toBe(true)
    expect(matchesChallenge('men uyg‘ondim va kunni', target)).toBe(false)
    expect(matchesChallenge('', '')).toBe(false)
  })

  it('measures how much is typed correctly', () => {
    const target = 'Yangi kun — yangi imkoniyat.'
    expect(correctPrefixLength('', target)).toBe(0)
    expect(correctPrefixLength('yangi k', target)).toBe(7)
    expect(correctPrefixLength('yangi kux', target)).toBe(8)
    expect(correctPrefixLength('yangi kun yangi imkoniyat', target)).toBe(target.length)
  })
})

describe('alarm repository', () => {
  it('creates, lists by time, updates and deletes', async () => {
    const db = createTestDb()
    const late = await createAlarm(db, { time: '07:15', weekdays: [5, 1, 1], label: ' Ish ' })
    await createAlarm(db, { time: '06:00' })
    expect(late).toMatchObject({ weekdays: [1, 5], label: 'Ish', enabled: true, textLength: 'short' })
    expect((await listAlarms(db)).map((a) => a.time)).toEqual(['06:00', '07:15'])

    await updateAlarm(db, late.id, { enabled: false, textLength: 'long' })
    expect((await listAlarms(db))[1]).toMatchObject({ enabled: false, textLength: 'long' })

    await deleteAlarm(db, late.id)
    expect(await listAlarms(db)).toHaveLength(1)
    await expect(createAlarm(db, { time: '7' })).rejects.toThrow()
  })
})
