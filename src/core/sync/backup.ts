import type { BloknotDB } from '../db/schema'
import type { Alarm, BaseRecord, DayReminder, Note, Notebook, Settings, Task, TaskOccurrence } from '../models/types'

export const BACKUP_FORMAT = 'bloknot'
/** Bump when the file layout changes; older files must still be readable. */
export const BACKUP_VERSION = 1
export const BACKUP_EXTENSION = '.bloknot'

/** Every table, including deleted records so deletions reach the other device. */
export interface BackupData {
  tasks: Task[]
  occurrences: TaskOccurrence[]
  notebooks: Notebook[]
  notes: Note[]
  settings: Settings[]
  /** Added in 1.2.0; files from older versions have none. */
  dayReminders: DayReminder[]
  /** Added in 1.3.0. */
  alarms: Alarm[]
}

export interface Backup {
  format: typeof BACKUP_FORMAT
  version: number
  exportedAt: number
  appVersion: string
  data: BackupData
}

export const TABLES = [
  'tasks',
  'occurrences',
  'notebooks',
  'notes',
  'settings',
  'dayReminders',
  'alarms',
] as const satisfies readonly (keyof BackupData)[]

export async function readAll(db: BloknotDB): Promise<BackupData> {
  const [tasks, occurrences, notebooks, notes, settings, dayReminders, alarms] = await Promise.all([
    db.tasks.toArray(),
    db.occurrences.toArray(),
    db.notebooks.toArray(),
    db.notes.toArray(),
    db.settings.toArray(),
    db.dayReminders.toArray(),
    db.alarms.toArray(),
  ])
  return { tasks, occurrences, notebooks, notes, settings, dayReminders, alarms }
}

export async function createBackup(db: BloknotDB, appVersion: string, now: number = Date.now()): Promise<Backup> {
  return { format: BACKUP_FORMAT, version: BACKUP_VERSION, exportedAt: now, appVersion, data: await readAll(db) }
}

export function backupFileName(now: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `bloknot-${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}${BACKUP_EXTENSION}`
}

export type BackupErrorCode = 'invalidJson' | 'notBloknot' | 'newerVersion' | 'badRecords'

export class BackupError extends Error {
  readonly code: BackupErrorCode
  constructor(code: BackupErrorCode) {
    super(code)
    this.code = code
  }
}

function isRecord(value: unknown): value is BaseRecord {
  if (typeof value !== 'object' || value === null) return false
  const record = value as Record<string, unknown>
  return (
    typeof record.id === 'string' &&
    typeof record.createdAt === 'number' &&
    typeof record.updatedAt === 'number' &&
    (record.deletedAt === null || typeof record.deletedAt === 'number')
  )
}

/** Reads a `.bloknot` file, refusing anything that is not one (or is from a newer app version). */
export function parseBackup(text: string): Backup {
  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch {
    throw new BackupError('invalidJson')
  }
  if (typeof raw !== 'object' || raw === null || (raw as { format?: unknown }).format !== BACKUP_FORMAT) {
    throw new BackupError('notBloknot')
  }
  const file = raw as Partial<Backup>
  if (typeof file.version !== 'number' || file.version > BACKUP_VERSION) throw new BackupError('newerVersion')
  const data = file.data as Partial<BackupData> | undefined
  if (typeof data !== 'object' || data === null) throw new BackupError('badRecords')
  for (const table of TABLES) {
    const rows = data[table] ?? []
    if (!Array.isArray(rows) || !rows.every(isRecord)) throw new BackupError('badRecords')
  }
  return {
    format: BACKUP_FORMAT,
    version: file.version,
    exportedAt: typeof file.exportedAt === 'number' ? file.exportedAt : 0,
    appVersion: typeof file.appVersion === 'string' ? file.appVersion : '',
    data: {
      tasks: data.tasks ?? [],
      occurrences: data.occurrences ?? [],
      notebooks: data.notebooks ?? [],
      notes: data.notes ?? [],
      settings: data.settings ?? [],
      dayReminders: data.dayReminders ?? [],
      alarms: data.alarms ?? [],
    },
  }
}

export interface BackupSummary {
  tasks: number
  notebooks: number
  notes: number
}

/** What a file contains, counting only records that are not deleted. */
export function backupSummary(backup: Backup): BackupSummary {
  const alive = (rows: BaseRecord[]) => rows.filter((row) => row.deletedAt === null).length
  return { tasks: alive(backup.data.tasks), notebooks: alive(backup.data.notebooks), notes: alive(backup.data.notes) }
}
