import { weekStartOf } from './dates'
import type { BloknotDB } from './db/schema'
import { listActive } from './db/repository'
import type { DateKey, MonthKey, Task, TaskStatus } from './models/types'
import { occursOn } from './recurrence'

/** One line of a day's to-do list. For a recurring task, status is that day's status. */
export interface AgendaItem {
  task: Task
  date: DateKey
  status: TaskStatus
  completedAt: number | null
  recurring: boolean
}

function byOrder(a: Task, b: Task): number {
  return a.order - b.order || a.createdAt - b.createdAt
}

function activeTasksOfKind(db: BloknotDB, kinds: Task['kind'][]): Promise<Task[]> {
  return db.tasks
    .where('kind')
    .anyOf(kinds)
    .filter((task) => task.deletedAt === null)
    .toArray()
}

/** Everything to do on `date`: daily tasks, recurring tasks due that day, and ranges covering it. */
export async function getDayAgenda(db: BloknotDB, date: DateKey): Promise<AgendaItem[]> {
  const tasks = (await activeTasksOfKind(db, ['daily', 'range'])).sort(byOrder)
  const occurrences = await db.occurrences
    .where('date')
    .equals(date)
    .filter((occurrence) => occurrence.deletedAt === null)
    .toArray()
  const occurrenceByTask = new Map(occurrences.map((occurrence) => [occurrence.taskId, occurrence]))

  const items: AgendaItem[] = []
  for (const task of tasks) {
    if (task.kind === 'range') {
      if (task.startDate && task.endDate && task.startDate <= date && date <= task.endDate) {
        items.push({ task, date, status: task.status, completedAt: task.completedAt, recurring: false })
      }
    } else if (task.recurrence) {
      if (task.date && occursOn(task.recurrence, task.date, date)) {
        const occurrence = occurrenceByTask.get(task.id)
        items.push({
          task,
          date,
          status: occurrence?.status ?? 'todo',
          completedAt: occurrence?.completedAt ?? null,
          recurring: true,
        })
      }
    } else if (task.date === date) {
      items.push({ task, date, status: task.status, completedAt: task.completedAt, recurring: false })
    }
  }
  return items
}

export async function getWeekTasks(db: BloknotDB, week: DateKey): Promise<Task[]> {
  const weekStart = weekStartOf(week)
  return (await activeTasksOfKind(db, ['weekly'])).filter((task) => task.weekStart === weekStart).sort(byOrder)
}

export async function getMonthTasks(db: BloknotDB, month: MonthKey): Promise<Task[]> {
  return (await activeTasksOfKind(db, ['monthly'])).filter((task) => task.month === month).sort(byOrder)
}

/** Tasks with a start and end date, earliest start first. */
export async function getRangeTasks(db: BloknotDB): Promise<Task[]> {
  return (await activeTasksOfKind(db, ['range'])).sort(
    (a, b) => (a.startDate ?? '').localeCompare(b.startDate ?? '') || byOrder(a, b),
  )
}

/** Tasks with no dates. */
export async function getGeneralTasks(db: BloknotDB): Promise<Task[]> {
  return (await activeTasksOfKind(db, ['general'])).sort(byOrder)
}

/** All tasks that are not deleted. */
export function getAllTasks(db: BloknotDB): Promise<Task[]> {
  return listActive(db.tasks)
}
