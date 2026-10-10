import type { Task } from '../../core/models/types'
import { t } from '../../i18n'
import { formatDayShort, formatMonth, formatRange, formatWeek } from '../../i18n/format'

/** Where a task lives, e.g. "8-oktabr, Kunlik" or "Umumiy". Used in the "saved" message. */
export function describeTaskPlace(task: Pick<Task, 'kind' | 'date' | 'weekStart' | 'month' | 'startDate' | 'endDate'>) {
  const kind = t(`kind.${task.kind}`)
  switch (task.kind) {
    case 'daily':
      return task.date ? `${formatDayShort(task.date)}, ${kind}` : kind
    case 'weekly':
      return task.weekStart ? `${formatWeek(task.weekStart)}, ${kind}` : kind
    case 'monthly':
      return task.month ? `${formatMonth(task.month)}, ${kind}` : kind
    case 'range':
      return task.startDate && task.endDate ? `${formatRange(task.startDate, task.endDate)}, ${kind}` : kind
    case 'general':
      return kind
  }
}
