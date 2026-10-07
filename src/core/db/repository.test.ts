import { describe, expect, it } from 'vitest'
import { createRecord, getActive, listActive, softDelete, updateRecord } from './repository'
import { createTestDb } from './testing'

const notebook = { title: 'Ish', color: '#4f46e5', order: 0 }

describe('repository', () => {
  it('creates a record with id and timestamps', async () => {
    const db = createTestDb()
    const created = await createRecord(db.notebooks, notebook, 1000)
    expect(created.id).toMatch(/^[0-9a-f-]{36}$/)
    expect(created).toMatchObject({ ...notebook, createdAt: 1000, updatedAt: 1000, deletedAt: null })
    expect(await db.notebooks.get(created.id)).toEqual(created)
  })

  it('keeps a given id', async () => {
    const db = createTestDb()
    const created = await createRecord(db.notebooks, { ...notebook, id: 'fixed' }, 1000)
    expect(created.id).toBe('fixed')
  })

  it('updates fields and bumps updatedAt', async () => {
    const db = createTestDb()
    const created = await createRecord(db.notebooks, notebook, 1000)
    const updated = await updateRecord(db.notebooks, created.id, { title: 'Uy' }, 2000)
    expect(updated).toMatchObject({ title: 'Uy', createdAt: 1000, updatedAt: 2000 })
  })

  it('always moves updatedAt forward, even if the clock does not', async () => {
    const db = createTestDb()
    const created = await createRecord(db.notebooks, notebook, 5000)
    const updated = await updateRecord(db.notebooks, created.id, { title: 'Uy' }, 4000)
    expect(updated.updatedAt).toBe(5001)
  })

  it('soft-deletes: the record is hidden but still stored', async () => {
    const db = createTestDb()
    const kept = await createRecord(db.notebooks, notebook, 1000)
    const removed = await createRecord(db.notebooks, { ...notebook, title: 'Eski' }, 1000)
    await softDelete(db.notebooks, removed.id, 3000)

    expect(await listActive(db.notebooks)).toEqual([kept])
    expect(await getActive(db.notebooks, removed.id)).toBeUndefined()
    expect(await db.notebooks.get(removed.id)).toMatchObject({ deletedAt: 3000, updatedAt: 3000 })
  })

  it('refuses to update a deleted record', async () => {
    const db = createTestDb()
    const created = await createRecord(db.notebooks, notebook, 1000)
    await softDelete(db.notebooks, created.id, 2000)
    await expect(updateRecord(db.notebooks, created.id, { title: 'X' }, 3000)).rejects.toThrow()
  })
})
