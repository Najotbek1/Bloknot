import { describe, expect, it } from 'vitest'
import { buildTask } from '../db/tasks'
import type { Task, TaskOccurrence } from '../models/types'
import { completionCounts, computeStats, dueDateOf, dueItems, heatmap } from './index'

let nextId = 1
function task(input: Parameters<typeof buildTask>[0]): Task {
  return { ...buildTask(input), id: `t${nextId++}`, createdAt: 0, updatedAt: 0, deletedAt: null }
}
/** Epoch ms at noon of a local date. */
const at = (date: string, hour = 12) => {
  const [y, m, d] = date.split('-').map(Number)
  return new Date(y, m - 1, d, hour).getTime()
}
function done(input: Parameters<typeof buildTask>[0], completedOn: string): Task {
  return task({ ...input, status: 'done', completedAt: at(completedOn) })
}
function occurrence(taskId: string, date: string, status: TaskOccurrence['status'], completedOn?: string): TaskOccurrence {
  return {
    id: `o-${taskId}-${date}`,
    taskId,
    date,
    status,
    completedAt: completedOn ? at(completedOn) : null,
    createdAt: 0,
    updatedAt: 0,
    deletedAt: null,
  }
}

describe('dueDateOf', () => {
  it('uses the day, Sunday of the week, end of month or end of range', () => {
    expect(dueDateOf(task({ title: 'a', kind: 'daily', date: '2026-10-07' }))).toBe('2026-10-07')
    expect(dueDateOf(task({ title: 'a', kind: 'weekly', weekStart: '2026-10-05' }))).toBe('2026-10-11')
    expect(dueDateOf(task({ title: 'a', kind: 'monthly', month: '2028-02' }))).toBe('2028-02-29')
    expect(dueDateOf(task({ title: 'a', kind: 'monthly', month: '2026-02' }))).toBe('2026-02-28')
    expect(dueDateOf(task({ title: 'a', kind: 'range', startDate: '2026-10-01', endDate: '2026-10-20' }))).toBe(
      '2026-10-20',
    )
    expect(dueDateOf(task({ title: 'a', kind: 'general' }))).toBeNull()
  })
})

describe('dueItems', () => {
  it('spreads recurring tasks over their days with each day’s status', () => {
    const sport = task({ title: 'Sport', kind: 'daily', date: '2026-10-01', recurrence: { freq: 'daily', interval: 1 } })
    const items = dueItems(
      { tasks: [sport], occurrences: [occurrence(sport.id, '2026-10-06', 'done', '2026-10-06')] },
      '2026-10-05',
      '2026-10-07',
    )
    expect(items.map((i) => [i.dueDate, i.status])).toEqual([
      ['2026-10-05', 'todo'],
      ['2026-10-06', 'done'],
      ['2026-10-07', 'todo'],
    ])
  })

  it('ignores deleted tasks and tasks due outside the range', () => {
    const deleted = { ...task({ title: 'x', kind: 'daily', date: '2026-10-06' }), deletedAt: 1 }
    const later = task({ title: 'y', kind: 'daily', date: '2026-10-09' })
    expect(dueItems({ tasks: [deleted, later], occurrences: [] }, '2026-10-01', '2026-10-07')).toEqual([])
  })
})

describe('computeStats', () => {
  const today = '2026-10-07' // Wednesday

  it('computes completion, on-time, activity and score', () => {
    const tasks = [
      done({ title: 'a', kind: 'daily', date: '2026-10-07' }, '2026-10-07'),
      done({ title: 'b', kind: 'daily', date: '2026-10-05' }, '2026-10-06'), // late
      task({ title: 'c', kind: 'daily', date: '2026-10-06' }), // missed
      task({ title: 'd', kind: 'daily', date: '2026-10-06', status: 'skipped' }), // not counted
      task({ title: 'e', kind: 'daily', date: '2026-10-08' }), // future
    ]
    const stats = computeStats({ tasks, occurrences: [] }, today, 7)
    expect(stats).toMatchObject({ from: '2026-10-01', planned: 3, done: 2, activeDays: 2, streak: 2, bestStreak: 2 })
    expect(stats.completionRate).toBeCloseTo(2 / 3)
    expect(stats.onTimeRate).toBeCloseTo(1 / 2)
    // 100 × (0.5 × 2/3 + 0.3 × 1/2 + 0.2 × 2/7) = 54.0…
    expect(stats.score).toBe(54)
    expect(stats.series.at(-2)).toEqual({ date: '2026-10-06', planned: 1, done: 0 })
    expect(stats.byKind.daily).toEqual({ done: 2, total: 3 })
  })

  it('has no score without anything due', () => {
    const stats = computeStats({ tasks: [], occurrences: [] }, today, 7)
    expect(stats).toMatchObject({ completionRate: null, onTimeRate: null, score: null, activeDays: 0 })
    expect(stats.series).toHaveLength(7)
  })

  it('counts undated tasks finished in the period and still open', () => {
    const tasks = [
      done({ title: 'g1', kind: 'general' }, '2026-10-03'),
      done({ title: 'g2', kind: 'general' }, '2026-08-01'),
      task({ title: 'g3', kind: 'general' }),
    ]
    expect(computeStats({ tasks, occurrences: [] }, today, 7).byKind.general).toEqual({ done: 1, total: 2 })
  })
})

describe('streaks', () => {
  const counts = (days: string[]) =>
    completionCounts({ tasks: days.map((d) => done({ title: d, kind: 'general' }, d)), occurrences: [] })

  it('counts from yesterday when nothing is done yet today', () => {
    const stats = computeStats(
      { tasks: ['2026-10-04', '2026-10-05', '2026-10-06'].map((d) => done({ title: d, kind: 'general' }, d)), occurrences: [] },
      '2026-10-07',
      7,
    )
    expect(stats.streak).toBe(3)
  })

  it('breaks on a gap and remembers the best run', () => {
    const tasks = ['2026-09-20', '2026-09-21', '2026-09-22', '2026-09-23', '2026-10-06', '2026-10-07'].map((d) =>
      done({ title: d, kind: 'general' }, d),
    )
    const stats = computeStats({ tasks, occurrences: [] }, '2026-10-07', 30)
    expect(stats.streak).toBe(2)
    expect(stats.bestStreak).toBe(4)
    expect(counts(['2026-10-07', '2026-10-07']).get('2026-10-07')).toBe(2)
  })
})

describe('heatmap', () => {
  it('lays out Monday–Sunday columns ending this week, with levels relative to the busiest day', () => {
    const counts = new Map([
      ['2026-10-05', 4],
      ['2026-10-06', 1],
      ['2026-10-07', 2],
      ['2026-10-08', 9], // future: ignored
    ])
    const grid = heatmap(counts, '2026-10-07', 2)
    expect(grid).toHaveLength(2)
    expect(grid[0][0].date).toBe('2026-09-28')
    expect(grid[1].map((c) => c.level)).toEqual([4, 1, 2, 0, 0, 0, 0])
    expect(grid[1][3]).toMatchObject({ date: '2026-10-08', future: true, count: 0 })
  })
})
