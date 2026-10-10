import type { BloknotDB } from '../db/schema'
import type { Backup } from './backup'
import { readAll } from './backup'
import { mergeData, type MergeReport } from './merge'

/** Merges a backup into the database in one transaction: either everything is written or nothing. */
export async function importBackup(db: BloknotDB, backup: Backup, now: number = Date.now()): Promise<MergeReport> {
  const tables = [db.tasks, db.occurrences, db.notebooks, db.notes, db.settings, db.dayReminders, db.alarms]
  return db.transaction('rw', tables, async () => {
    const { toPut, report } = mergeData(await readAll(db), backup.data, now)
    await db.tasks.bulkPut(toPut.tasks)
    await db.occurrences.bulkPut(toPut.occurrences)
    await db.notebooks.bulkPut(toPut.notebooks)
    await db.notes.bulkPut(toPut.notes)
    await db.settings.bulkPut(toPut.settings)
    await db.dayReminders.bulkPut(toPut.dayReminders)
    await db.alarms.bulkPut(toPut.alarms)
    return report
  })
}
