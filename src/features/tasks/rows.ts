import type { DateKey, Task, TaskStatus } from '../../core/models/types'
import type { AgendaItem } from '../../core/queries'
import { rangeElapsed, rangeHint, recurrenceSummary } from './labels'

export interface TaskRow {
  task: Task
  status: TaskStatus
  /** The day whose status is shown; needed to check off a recurring task. */
  date?: DateKey
  meta?: string
  progress?: number
}

/** Rows for a day's agenda, with the repeat rule or range countdown as the grey line. */
export function agendaRows(items: AgendaItem[], today: DateKey): TaskRow[] {
  return items.map((item) => ({
    task: item.task,
    status: item.status,
    date: item.date,
    meta:
      item.task.recurrence && item.task.date
        ? recurrenceSummary(item.task.recurrence, item.task.date)
        : item.task.kind === 'range'
          ? rangeHint(item.task, today)
          : undefined,
    progress: item.task.kind === 'range' ? rangeElapsed(item.task, today) : undefined,
  }))
}

export function taskRows(tasks: Task[]): TaskRow[] {
  return tasks.map((task) => ({ task, status: task.status }))
}
