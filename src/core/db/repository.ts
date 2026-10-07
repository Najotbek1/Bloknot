import type { Table } from 'dexie'
import type { BaseRecord, NewRecord } from '../models/types'

/** Editable fields of a record: everything except the bookkeeping in `BaseRecord`. */
export type RecordChanges<T extends BaseRecord> = Partial<Omit<T, keyof BaseRecord>>

/** Next `updatedAt`: never goes backwards and always changes, even within the same millisecond. */
function nextTimestamp(previous: number, now: number): number {
  return Math.max(now, previous + 1)
}

export async function createRecord<T extends BaseRecord>(
  table: Table<T, string>,
  data: NewRecord<T>,
  now: number = Date.now(),
): Promise<T> {
  const record = {
    ...data,
    id: data.id ?? crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  } as T
  await table.add(record)
  return record
}

/** Returns the record with `id`, or `undefined` if it does not exist or was deleted. */
export async function getActive<T extends BaseRecord>(
  table: Table<T, string>,
  id: string,
): Promise<T | undefined> {
  const record = await table.get(id)
  return record && record.deletedAt === null ? record : undefined
}

export async function updateRecord<T extends BaseRecord>(
  table: Table<T, string>,
  id: string,
  changes: RecordChanges<T>,
  now: number = Date.now(),
): Promise<T> {
  const existing = await getActive(table, id)
  if (!existing) throw new Error(`Record not found: ${id}`)
  const updated = { ...existing, ...changes, updatedAt: nextTimestamp(existing.updatedAt, now) }
  await table.put(updated)
  return updated
}

/** Marks a record deleted. It stays stored so the deletion can be synced to other devices. */
export async function softDelete<T extends BaseRecord>(
  table: Table<T, string>,
  id: string,
  now: number = Date.now(),
): Promise<void> {
  const existing = await getActive(table, id)
  if (!existing) return
  const updatedAt = nextTimestamp(existing.updatedAt, now)
  await table.put({ ...existing, updatedAt, deletedAt: updatedAt })
}

/** All records that are not deleted. */
export async function listActive<T extends BaseRecord>(table: Table<T, string>): Promise<T[]> {
  return table.filter((record) => record.deletedAt === null).toArray()
}
