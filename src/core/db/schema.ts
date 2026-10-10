import { Dexie, type Table } from 'dexie'
import type { Note, Notebook, Settings, Task, TaskOccurrence } from '../models/types'

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

  constructor(name: string = DATABASE_NAME) {
    super(name)
    this.version(1).stores({
      tasks: 'id, kind, date, weekStart, month, notebookId, updatedAt',
      occurrences: 'id, taskId, date, [taskId+date], updatedAt',
      notebooks: 'id, updatedAt',
      notes: 'id, notebookId, taskId, updatedAt',
      settings: 'id',
    })
  }
}

/** The app's database. Tests create their own `BloknotDB` with a unique name instead. */
export const db = new BloknotDB()
