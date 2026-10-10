import type { BaseRecord, TaskOccurrence } from '../models/types'
import type { BackupData } from './backup'
import { TABLES } from './backup'

export interface MergeReport {
  /** New on this device. */
  added: number
  /** Changed to the newer copy from the file. */
  updated: number
  /** Deleted because they were deleted on the other device later. */
  deleted: number
  /** Already the same or newer here. */
  unchanged: number
}

export interface MergeResult {
  /** Records to write, per table. */
  toPut: BackupData
  report: MergeReport
}

const emptyData = (): BackupData => ({
  tasks: [],
  occurrences: [],
  notebooks: [],
  notes: [],
  settings: [],
  dayReminders: [],
  alarms: [],
})

/**
 * Last write wins, per record: a record from the file replaces the local one only if it was changed
 * later (`updatedAt`). Ties keep the local copy. Deleted records travel too, so deletions sync.
 *
 * A recurring task's day can get different ids on two devices, so occurrences are matched by
 * task + day; when the file's copy wins, the local duplicate is marked deleted.
 */
export function mergeData(local: BackupData, incoming: BackupData, now: number = Date.now()): MergeResult {
  const toPut = emptyData()
  const report: MergeReport = { added: 0, updated: 0, deleted: 0, unchanged: 0 }

  const decide = <T extends BaseRecord>(mine: T | undefined, theirs: T, put: (record: T) => void) => {
    if (!mine) {
      put(theirs)
      if (theirs.deletedAt === null) report.added++
      else report.unchanged++ // A deletion of something this device never had.
      return
    }
    if (theirs.updatedAt <= mine.updatedAt) {
      report.unchanged++
      return
    }
    put(theirs)
    if (theirs.deletedAt !== null && mine.deletedAt === null) report.deleted++
    else report.updated++
  }

  for (const table of TABLES) {
    if (table === 'occurrences') continue
    const mine = new Map<string, BaseRecord>(local[table].map((record) => [record.id, record]))
    const rows = toPut[table] as BaseRecord[]
    for (const theirs of incoming[table] as BaseRecord[]) {
      decide(mine.get(theirs.id), theirs, (record) => rows.push(record))
    }
  }

  const occurrenceKey = (o: TaskOccurrence) => `${o.taskId}|${o.date}`
  const byId = new Map(local.occurrences.map((o) => [o.id, o]))
  const activeByKey = new Map(local.occurrences.filter((o) => o.deletedAt === null).map((o) => [occurrenceKey(o), o]))
  for (const theirs of incoming.occurrences) {
    const sameId = byId.get(theirs.id)
    if (sameId) {
      decide(sameId, theirs, (record) => toPut.occurrences.push(record))
      continue
    }
    const twin = theirs.deletedAt === null ? activeByKey.get(occurrenceKey(theirs)) : undefined
    if (!twin) {
      decide(undefined, theirs, (record) => toPut.occurrences.push(record))
      continue
    }
    // Same task and day under another id: keep whichever changed last, retire the other.
    if (theirs.updatedAt > twin.updatedAt) {
      toPut.occurrences.push(theirs, { ...twin, deletedAt: now, updatedAt: Math.max(now, twin.updatedAt + 1) })
      report.updated++
    } else {
      toPut.occurrences.push({ ...theirs, deletedAt: now, updatedAt: Math.max(now, theirs.updatedAt + 1) })
      report.unchanged++
    }
  }

  return { toPut, report }
}
