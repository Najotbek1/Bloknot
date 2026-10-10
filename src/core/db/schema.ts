import { Dexie, type Table } from 'dexie'
import type { Alarm, DayReminder, Note, Notebook, Settings, Task, TaskOccurrence } from '../models/types'

export const DATABASE_NAME = 'bloknot'

/**
 * Local database. To change the schema, never edit an existing `version()` block:
 * add `this.version(N + 1).stores({...}).upgrade(tx => ...)` so installed apps migrate their data.
 */
export class BloknotDB extends Dexie {
  tasks!: Table<Task, string>
  occurrences!: Table<TaskOccurrence, string>
  notebooks!: Table<Notebook, string>
  notes!: Table<Note, string>
  settings!: Table<Settings, string>
  dayReminders!: Table<DayReminder, string>
  alarms!: Table<Alarm, string>

  constructor(name: string = DATABASE_NAME) {
    super(name)
    this.version(1).stores({
      tasks: 'id, kind, date, weekStart, month, notebookId, updatedAt',
      occurrences: 'id, taskId, date, [taskId+date], updatedAt',
      notebooks: 'id, updatedAt',
      notes: 'id, notebookId, taskId, updatedAt',
      settings: 'id',
    })
    // v2 (1.2.0): reminders pinned to calendar days. A new table only, so nothing to migrate.
    this.version(2).stores({
      dayReminders: 'id, date, updatedAt',
    })
    // v3 (1.3.0): wake-up alarms. A new table only, so nothing to migrate.
    this.version(3).stores({
      alarms: 'id, updatedAt',
    })
  }
}

/** The app's database. Tests create their own `BloknotDB` with a unique name instead. */
export const db = new BloknotDB()
