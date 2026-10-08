import { endOfMonth } from 'date-fns'
import { addDays, parseDateKey, toDateKey, weekStartOf } from '../dates'
import type { DateKey, Task, TaskKind, TaskOccurrence, TaskStatus } from '../models/types'
import { occurrencesBetween } from '../recurrence'

/** One thing that was due on a day: a task, or one day of a recurring task. */
export interface DueItem {
  taskId: string
  kind: TaskKind
  dueDate: DateKey
  status: TaskStatus
  completedAt: number | null
}

export interface StatsSnapshot {
  tasks: Task[]
  occurrences: TaskOccurrence[]
}

/** The last day a one-off task should be done by; `null` for tasks without dates. */
export function dueDateOf(task: Task): DateKey | null {
  switch (task.kind) {
    case 'daily':
      return task.date
    case 'weekly':
      return task.weekStart ? addDays(task.weekStart, 6) : null
    case 'monthly':
      return task.month ? toDateKey(endOfMonth(parseDateKey(`${task.month}-01`))) : null
    case 'range':
      return task.endDate
    case 'general':
      return null
  }
}

/** Everything due between `from` and `to` (inclusive); recurring tasks give one item per day. */
export function dueItems(snapshot: StatsSnapshot, from: DateKey, to: DateKey): DueItem[] {
  const occurrenceOf = new Map(
    snapshot.occurrences
      .filter((occurrence) => occurrence.deletedAt === null)
      .map((occurrence) => [`${occurrence.taskId}|${occurrence.date}`, occurrence]),
  )
  const items: DueItem[] = []
  for (const task of snapshot.tasks) {
    if (task.deletedAt !== null) continue
    if (task.recurrence && task.date) {
      for (const date of occurrencesBetween(task.recurrence, task.date, from, to)) {
        const occurrence = occurrenceOf.get(`${task.id}|${date}`)
        items.push({
          taskId: task.id,
          kind: task.kind,
          dueDate: date,
          status: occurrence?.status ?? 'todo',
          completedAt: occurrence?.completedAt ?? null,
        })
      }
      continue
    }
    const due = dueDateOf(task)
    if (due && from <= due && due <= to) {
      items.push({ taskId: task.id, kind: task.kind, dueDate: due, status: task.status, completedAt: task.completedAt })
    }
  }
  return items
}

/** How many things were completed on each day, by the time they were checked off. */
export function completionCounts(snapshot: StatsSnapshot): Map<DateKey, number> {
  const counts = new Map<DateKey, number>()
  const add = (completedAt: number | null) => {
    if (completedAt === null) return
    const day = toDateKey(new Date(completedAt))
    counts.set(day, (counts.get(day) ?? 0) + 1)
  }
  for (const task of snapshot.tasks) {
    if (task.deletedAt === null && !task.recurrence && task.status === 'done') add(task.completedAt)
  }
  for (const occurrence of snapshot.occurrences) {
    if (occurrence.deletedAt === null && occurrence.status === 'done') add(occurrence.completedAt)
  }
  return counts
}

export interface DayStat {
  date: DateKey
  /** Due that day, not counting skipped ones. */
  planned: number
  /** Of those, how many are done. */
  done: number
}

export interface KindStat {
  done: number
  total: number
}

export interface Stats {
  from: DateKey
  to: DateKey
  days: number
  planned: number
  done: number
  /** Share of due items done, 0–1; `null` when nothing was due. */
  completionRate: number | null
  /** Share of done items finished by their due day, 0–1; `null` when nothing is done. */
  onTimeRate: number | null
  /** Days in the period with at least one completion. */
  activeDays: number
  /** Consecutive days with a completion, ending today (or yesterday if today has none yet). */
  streak: number
  bestStreak: number
  /** 0–100; `null` when there is not enough data. */
  score: number | null
  byKind: Record<TaskKind, KindStat>
  series: DayStat[]
}

function streaks(counts: Map<DateKey, number>, today: DateKey): { streak: number; bestStreak: number } {
  const active = (day: DateKey) => (counts.get(day) ?? 0) > 0
  let streak = 0
  for (let day = active(today) ? today : addDays(today, -1); active(day); day = addDays(day, -1)) streak++

  let bestStreak = 0
  let run = 0
  const days = [...counts.keys()].filter((day) => day <= today && active(day)).sort()
  for (let i = 0; i < days.length; i++) {
    run = i > 0 && addDays(days[i - 1], 1) === days[i] ? run + 1 : 1
    bestStreak = Math.max(bestStreak, run)
  }
  return { streak, bestStreak: Math.max(bestStreak, streak) }
}

/** Weights of the responsibility score. */
export const SCORE_WEIGHTS = { completion: 0.5, onTime: 0.3, activity: 0.2 } as const

/** Statistics for the `days` days ending with `today`. */
export function computeStats(snapshot: StatsSnapshot, today: DateKey, days: number): Stats {
  const from = addDays(today, -(days - 1))
  const counted = dueItems(snapshot, from, today).filter((item) => item.status !== 'skipped')
  const doneItems = counted.filter((item) => item.status === 'done')
  const onTime = doneItems.filter(
    (item) => item.completedAt !== null && toDateKey(new Date(item.completedAt)) <= item.dueDate,
  )
  const counts = completionCounts(snapshot)

  const series: DayStat[] = []
  let activeDays = 0
  for (let day = from; day <= today; day = addDays(day, 1)) {
    const due = counted.filter((item) => item.dueDate === day)
    series.push({ date: day, planned: due.length, done: due.filter((item) => item.status === 'done').length })
    if ((counts.get(day) ?? 0) > 0) activeDays++
  }

  const byKind: Record<TaskKind, KindStat> = {
    daily: { done: 0, total: 0 },
    weekly: { done: 0, total: 0 },
    monthly: { done: 0, total: 0 },
    range: { done: 0, total: 0 },
    general: { done: 0, total: 0 },
  }
  for (const item of counted) {
    byKind[item.kind].total++
    if (item.status === 'done') byKind[item.kind].done++
  }
  // Undated tasks: the ones finished in this period, plus the ones still open.
  for (const task of snapshot.tasks) {
    if (task.deletedAt !== null || task.kind !== 'general' || task.status === 'skipped') continue
    const finishedNow =
      task.status === 'done' && task.completedAt !== null && toDateKey(new Date(task.completedAt)) >= from
    if (finishedNow) byKind.general.done++
    if (finishedNow || task.status !== 'done') byKind.general.total++
  }

  const completionRate = counted.length > 0 ? doneItems.length / counted.length : null
  const onTimeRate = doneItems.length > 0 ? onTime.length / doneItems.length : null
  const score =
    completionRate === null
      ? null
      : Math.round(
          100 *
            (SCORE_WEIGHTS.completion * completionRate +
              SCORE_WEIGHTS.onTime * (onTimeRate ?? 0) +
              SCORE_WEIGHTS.activity * (activeDays / days)),
        )

  return {
    from,
    to: today,
    days,
    planned: counted.length,
    done: doneItems.length,
    completionRate,
    onTimeRate,
    activeDays,
    ...streaks(counts, today),
    score,
    byKind,
    series,
  }
}

export interface HeatmapCell {
  date: DateKey
  count: number
  /** 0 = nothing done, 1–4 = more and more, relative to the busiest day shown. */
  level: 0 | 1 | 2 | 3 | 4
  future: boolean
}

/** `weeks` columns of Monday–Sunday cells, oldest first, the last column being this week. */
export function heatmap(counts: Map<DateKey, number>, today: DateKey, weeks = 12): HeatmapCell[][] {
  const start = addDays(weekStartOf(today), -7 * (weeks - 1))
  const columns: HeatmapCell[][] = []
  let max = 0
  for (let day = start; day <= today; day = addDays(day, 1)) max = Math.max(max, counts.get(day) ?? 0)
  for (let w = 0; w < weeks; w++) {
    const column: HeatmapCell[] = []
    for (let d = 0; d < 7; d++) {
      const date = addDays(start, w * 7 + d)
      const future = date > today
      const count = future ? 0 : (counts.get(date) ?? 0)
      const level = count === 0 ? 0 : (Math.min(4, Math.max(1, Math.ceil((count / max) * 4))) as 1 | 2 | 3 | 4)
      column.push({ date, count, level, future })
    }
    columns.push(column)
  }
  return columns
}
