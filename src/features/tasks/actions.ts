import { softDelete } from '../../core/db/repository'
import type { BloknotDB } from '../../core/db/schema'
import { setOccurrenceStatus, setTaskStatus } from '../../core/db/tasks'
import type { DateKey, Task, TaskStatus } from '../../core/models/types'

/**
 * Sets a task's status. For a recurring task the status belongs to one day, so `date` is required.
 */
export async function changeStatus(
  db: BloknotDB,
  task: Task,
  status: TaskStatus,
  date?: DateKey,
): Promise<void> {
  if (task.recurrence) {
    if (!date) throw new Error('A recurring task needs the day whose status changes')
    await setOccurrenceStatus(db, task.id, date, status)
  } else {
    await setTaskStatus(db, task.id, status)
  }
}

/** Checkbox behaviour: anything not done becomes done, done goes back to "todo". */
export function toggleDone(db: BloknotDB, task: Task, currentStatus: TaskStatus, date?: DateKey) {
  return changeStatus(db, task, currentStatus === 'done' ? 'todo' : 'done', date)
}

export function deleteTask(db: BloknotDB, id: string) {
  return softDelete(db.tasks, id)
}
