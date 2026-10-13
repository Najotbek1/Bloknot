import { describe, expect, it } from 'vitest'
import { reorderTasks, createTask } from './db/tasks'
import { createTestDb } from './db/testing'
import { getGeneralTasks } from './queries'
import { createBackup, parseBackup } from './sync/backup'
import { importBackup } from './sync/importBackup'
import { moveItem } from './order'

describe('moveItem', () => {
  it('moves an item forwards and backwards, clamping the target', () => {
    expect(moveItem(['a', 'b', 'c', 'd'], 0, 2)).toEqual(['b', 'c', 'a', 'd'])
    expect(moveItem(['a', 'b', 'c', 'd'], 3, 0)).toEqual(['d', 'a', 'b', 'c'])
    expect(moveItem(['a', 'b', 'c'], 1, 99)).toEqual(['a', 'c', 'b'])
    expect(moveItem(['a', 'b'], 5, 0)).toEqual(['a', 'b'])
  })
})

describe('reorderTasks', () => {
  const titles = async (db: ReturnType<typeof createTestDb>) => (await getGeneralTasks(db)).map((t) => t.title)

  it('keeps the chosen order, puts new tasks last, and syncs to another device', async () => {
    const phone = createTestDb()
    const a = await createTask(phone, { title: 'A', kind: 'general' }, 1000)
    const b = await createTask(phone, { title: 'B', kind: 'general' }, 2000)
    const c = await createTask(phone, { title: 'C', kind: 'general' }, 3000)
    expect(await titles(phone)).toEqual(['A', 'B', 'C'])

    // Copy to the computer first, then reorder on the phone.
    const computer = createTestDb()
    await importBackup(computer, parseBackup(JSON.stringify(await createBackup(phone, '0.10.0', 3500))))

    await reorderTasks(phone, [c.id, a.id, b.id, c.id], 4000)
    expect(await titles(phone)).toEqual(['C', 'A', 'B'])
    await createTask(phone, { title: 'D', kind: 'general' }, 5000)
    expect(await titles(phone)).toEqual(['C', 'A', 'B', 'D'])

    const report = await importBackup(computer, parseBackup(JSON.stringify(await createBackup(phone, '0.10.0', 6000))))
    expect(report.updated).toBeGreaterThan(0)
    expect(await titles(computer)).toEqual(['C', 'A', 'B', 'D'])
  })

  it('writes only the tasks whose position changed', async () => {
    const db = createTestDb()
    const a = await createTask(db, { title: 'A', kind: 'general', order: 0 }, 1000)
    const b = await createTask(db, { title: 'B', kind: 'general', order: 1 }, 1000)
    await reorderTasks(db, [a.id, b.id], 9000)
    expect((await db.tasks.get(a.id))?.updatedAt).toBe(1000)
  })
})
