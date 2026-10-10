import { endOfMonth } from 'date-fns'
import { addDays, parseDateKey, toDateKey, weekdayOf, weekStartOf } from '../dates'
import type { DateKey, Task, TaskKind, TaskOccurrence, TaskStatus, Weekday } from '../models/types'
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

/** When each finished thing was checked off (one-off tasks and days of recurring ones). */
export function completionTimes(snapshot: StatsSnapshot): number[] {
  const times: number[] = []
  for (const task of snapshot.tasks) {
    if (task.deletedAt === null && !task.recurrence && task.status === 'done' && task.completedAt !== null) {
      times.push(task.completedAt)
    }
  }
  for (const occurrence of snapshot.occurrences) {
    if (occurrence.deletedAt === null && occurrence.status === 'done' && occurrence.completedAt !== null) {
      times.push(occurrence.completedAt)
    }
  }
  return times
}

/** How many things were completed on each day, by the time they were checked off. */
export function completionCounts(snapshot: StatsSnapshot): Map<DateKey, number> {
  const counts = new Map<DateKey, number>()
  for (const completedAt of completionTimes(snapshot)) {
    const day = toDateKey(new Date(completedAt))
    counts.set(day, (counts.get(day) ?? 0) + 1)
  }
  return counts
}

/** The day the first task was created; `null` with no tasks. */
export function firstUseDay(snapshot: StatsSnapshot): DateKey | null {
  let first: number | null = null
  for (const task of snapshot.tasks) {
    if (first === null || task.createdAt < first) first = task.createdAt
  }
  return first === null ? null : toDateKey(new Date(first))
}

/**
 * The items a period is judged on: skipped ones never count, and today's still-open ones are
 * pending rather than missed (the day is not over), so they do not pull the rates down.
 */
function judgedItems(snapshot: StatsSnapshot, from: DateKey, to: DateKey, today: DateKey): DueItem[] {
  return dueItems(snapshot, from, to).filter(
    (item) => item.status !== 'skipped' && (item.dueDate < today || item.status === 'done'),
  )
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
  /** Due today and not done yet: not counted against the rates until the day is over. */
  pendingToday: number
  /** Days in the period with at least one completion. */
  activeDays: number
  /** Days of the period the app was in use (from the first task on), the base of `activeDays`. */
  activeSpan: number
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
  const counted = judgedItems(snapshot, from, today, today)
  const pendingToday = dueItems(snapshot, today, today).filter(
    (item) => item.status === 'todo' || item.status === 'in_progress',
  ).length
  const doneItems = counted.filter((item) => item.status === 'done')
  const onTime = doneItems.filter(
    (item) => item.completedAt !== null && toDateKey(new Date(item.completedAt)) <= item.dueDate,
  )
  const counts = completionCounts(snapshot)

  // The chart shows today's full plan, including what is still open.
  const charted = dueItems(snapshot, from, today).filter((item) => item.status !== 'skipped')
  const series: DayStat[] = []
  let activeDays = 0
  for (let day = from; day <= today; day = addDays(day, 1)) {
    const due = charted.filter((item) => item.dueDate === day)
    series.push({ date: day, planned: due.length, done: due.filter((item) => item.status === 'done').length })
    if ((counts.get(day) ?? 0) > 0) activeDays++
  }
  const firstDay = firstUseDay(snapshot)
  const spanStart = firstDay && firstDay > from ? firstDay : from
  const activeSpan = spanStart > today ? 1 : Math.round((parseDateKey(today).getTime() - parseDateKey(spanStart).getTime()) / 86_400_000) + 1

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
              SCORE_WEIGHTS.activity * Math.min(1, activeDays / activeSpan)),
        )

  return {
    from,
    to: today,
    days,
    planned: counted.length,
    done: doneItems.length,
    completionRate,
    onTimeRate,
    pendingToday,
    activeDays,
    activeSpan,
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

/** The same statistics for the `days` days just before the current period, to compare against. */
export function previousStats(snapshot: StatsSnapshot, today: DateKey, days: number): Stats {
  return computeStats(snapshot, addDays(today, -days), days)
}

export interface WeekdayStat {
  weekday: Weekday
  done: number
  total: number
}

/** Done / due per weekday (Monday first) over the period, judged like `computeStats`. */
export function weekdayStats(snapshot: StatsSnapshot, today: DateKey, days: number): WeekdayStat[] {
  const result: WeekdayStat[] = ([1, 2, 3, 4, 5, 6, 7] as Weekday[]).map((weekday) => ({ weekday, done: 0, total: 0 }))
  for (const item of judgedItems(snapshot, addDays(today, -(days - 1)), today, today)) {
    const row = result[weekdayOf(item.dueDate) - 1]
    row.total++
    if (item.status === 'done') row.done++
  }
  return result
}

export type DayPart = 'morning' | 'afternoon' | 'evening' | 'night'

export const DAY_PARTS: DayPart[] = ['morning', 'afternoon', 'evening', 'night']

/** Morning 05–11, afternoon 12–16, evening 17–21, night 22–04, by local hour. */
export function dayPartOf(hour: number): DayPart {
  if (hour >= 5 && hour < 12) return 'morning'
  if (hour >= 12 && hour < 17) return 'afternoon'
  if (hour >= 17 && hour < 22) return 'evening'
  return 'night'
}

/** How many things were checked off in each part of the day during the period. */
export function dayPartCounts(snapshot: StatsSnapshot, today: DateKey, days: number): Record<DayPart, number> {
  const from = addDays(today, -(days - 1))
  const counts: Record<DayPart, number> = { morning: 0, afternoon: 0, evening: 0, night: 0 }
  for (const completedAt of completionTimes(snapshot)) {
    const date = new Date(completedAt)
    const day = toDateKey(date)
    if (day >= from && day <= today) counts[dayPartOf(date.getHours())]++
  }
  return counts
}

/** One-off tasks whose day has passed and that are still open, oldest first. */
export function overdueTasks(snapshot: StatsSnapshot, today: DateKey): Task[] {
  return snapshot.tasks
    .filter((task) => {
      if (task.deletedAt !== null || task.recurrence) return false
      if (task.status !== 'todo' && task.status !== 'in_progress') return false
      const due = dueDateOf(task)
      return due !== null && due < today
    })
    .sort((a, b) => (dueDateOf(a) ?? '').localeCompare(dueDateOf(b) ?? ''))
}
