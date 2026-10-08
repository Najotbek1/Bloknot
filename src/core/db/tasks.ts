import { monthKeyOf, parseDateKey, weekStartOf } from '../dates'
import type { DateKey, Settings, Task, TaskOccurrence, TaskStatus } from '../models/types'
import { occursOn } from '../recurrence'
import { createRecord, getActive, updateRecord, type RecordChanges } from './repository'
import type { BloknotDB } from './schema'

/** What the caller must provide to create a task; everything else has a default. */
export type TaskInput = Pick<Task, 'title' | 'kind'> & Partial<Omit<Task, 'title' | 'kind' | 'id'>>

/**
 * Fills defaults and checks that the date fields required by `kind` are present.
 * `weekStart` is normalized to Monday and `month` to `YYYY-MM`.
 */
export function buildTask(input: TaskInput): Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'> {
  const task = {
    notes: '',
    status: 'todo' as TaskStatus,
    priority: 'normal' as const,
    date: null,
    weekStart: null,
    month: null,
    startDate: null,
    endDate: null,
    reminders: [],
    recurrence: null,
    completedAt: null,
    notebookId: null,
    order: 0,
    ...input,
    title: input.title.trim(),
  }
  if (!task.title) throw new Error('Task title is required')

  switch (task.kind) {
    case 'daily':
      if (!task.date) throw new Error('Daily task needs a date')
      parseDateKey(task.date)
      break
    case 'weekly':
      if (!task.weekStart) throw new Error('Weekly task needs a week')
      task.weekStart = weekStartOf(task.weekStart)
      break
    case 'monthly':
      if (!task.month) throw new Error('Monthly task needs a month')
      task.month = monthKeyOf(task.month.length === 7 ? `${task.month}-01` : task.month)
      break
    case 'range':
      if (!task.startDate || !task.endDate) throw new Error('Range task needs start and end dates')
      parseDateKey(task.startDate)
      parseDateKey(task.endDate)
      if (task.endDate < task.startDate) throw new Error('End date is before start date')
      break
    case 'general':
      break
  }
  if (task.recurrence && task.kind !== 'daily') {
    throw new Error('Only daily tasks can repeat')
  }
  return task
}

export function createTask(db: BloknotDB, input: TaskInput, now: number = Date.now()): Promise<Task> {
  return createRecord(db.tasks, buildTask(input), now)
}

export function updateTask(
  db: BloknotDB,
  id: string,
  changes: RecordChanges<Task>,
  now: number = Date.now(),
): Promise<Task> {
  return updateRecord(db.tasks, id, changes, now)
}

function completedAtFor(status: TaskStatus, previous: number | null, now: number): number | null {
  if (status !== 'done') return null
  return previous ?? now
}

/** Changes the status of a one-off task. Recurring tasks use `setOccurrenceStatus`. */
export async function setTaskStatus(
  db: BloknotDB,
  id: string,
  status: TaskStatus,
  now: number = Date.now(),
): Promise<Task> {
  const task = await getActive(db.tasks, id)
  if (!task) throw new Error(`Task not found: ${id}`)
  if (task.recurrence) throw new Error('Use setOccurrenceStatus for recurring tasks')
  return updateRecord(db.tasks, id, { status, completedAt: completedAtFor(status, task.completedAt, now) }, now)
}

export async function getOccurrence(
  db: BloknotDB,
  taskId: string,
  date: DateKey,
): Promise<TaskOccurrence | undefined> {
  const matches = await db.occurrences.where('[taskId+date]').equals([taskId, date]).toArray()
  return matches.find((occurrence) => occurrence.deletedAt === null)
}

/** Changes the status of one day of a recurring task. */
export async function setOccurrenceStatus(
  db: BloknotDB,
  taskId: string,
  date: DateKey,
  status: TaskStatus,
  now: number = Date.now(),
): Promise<TaskOccurrence> {
  const task = await getActive(db.tasks, taskId)
  if (!task) throw new Error(`Task not found: ${taskId}`)
  if (!task.recurrence || !task.date) throw new Error('Task does not repeat')
  if (!occursOn(task.recurrence, task.date, date)) throw new Error(`Task does not occur on ${date}`)

  const existing = await getOccurrence(db, taskId, date)
  if (existing) {
    return updateRecord(
      db.occurrences,
      existing.id,
      { status, completedAt: completedAtFor(status, existing.completedAt, now) },
      now,
    )
  }
  return createRecord(
    db.occurrences,
    { taskId, date, status, completedAt: completedAtFor(status, null, now) },
    now,
  )
}

export const DEFAULT_SETTINGS: Settings = {
  id: 'settings',
  createdAt: 0,
  updatedAt: 0,
  deletedAt: null,
  theme: 'system',
  morningSummary: true,
  morningSummaryTime: '08:00',
  eveningSummary: true,
  eveningSummaryTime: '21:00',
  deadlineWarnings: true,
  language: 'uz',
}

export async function getSettings(db: BloknotDB): Promise<Settings> {
  return { ...DEFAULT_SETTINGS, ...(await db.settings.get('settings')) }
}

export async function updateSettings(
  db: BloknotDB,
  changes: RecordChanges<Settings>,
  now: number = Date.now(),
): Promise<Settings> {
  const current = await getSettings(db)
  const updated: Settings = {
    ...current,
    ...changes,
    createdAt: current.createdAt || now,
    updatedAt: Math.max(now, current.updatedAt + 1),
  }
  await db.settings.put(updated)
  return updated
}
