import { describe, expect, it } from 'vitest'
import { createNote, createNotebook, listAllNotes } from '../db/notebooks'
import { softDelete } from '../db/repository'
import { createTask, getOccurrence, setOccurrenceStatus, setTaskStatus, updateSettings, updateTask } from '../db/tasks'
import { createTestDb } from '../db/testing'
import { getAllTasks } from '../queries'
import { backupFileName, backupSummary, BackupError, createBackup, parseBackup, readAll } from './backup'
import { importBackup } from './importBackup'
import { mergeData } from './merge'

/** Export from one database and import into another, as if via a file. */
async function transfer(from: ReturnType<typeof createTestDb>, to: ReturnType<typeof createTestDb>, now: number) {
  const text = JSON.stringify(await createBackup(from, '0.6.0', now))
  return importBackup(to, parseBackup(text), now)
}

const titles = async (db: ReturnType<typeof createTestDb>) => (await getAllTasks(db)).map((t) => t.title).sort()

describe('parseBackup', () => {
  it('rejects files that are not Bloknot backups', () => {
    const code = (text: string) => {
      try {
        parseBackup(text)
      } catch (error) {
        return (error as BackupError).code
      }
    }
    expect(code('not json')).toBe('invalidJson')
    expect(code('{"hello":1}')).toBe('notBloknot')
    expect(code('{"format":"bloknot","version":99,"data":{}}')).toBe('newerVersion')
    expect(code('{"format":"bloknot","version":1,"data":{"tasks":[{"title":"no id"}]}}')).toBe('badRecords')
  })

  it('accepts missing tables and fills them with empty lists', () => {
    const backup = parseBackup('{"format":"bloknot","version":1,"exportedAt":5,"data":{}}')
    expect(backup.data.tasks).toEqual([])
    expect(backup.exportedAt).toBe(5)
  })

  it('names files by date', () => {
    expect(backupFileName(new Date(2026, 9, 8))).toBe('bloknot-2026-10-08.bloknot')
  })
})

describe('mergeData', () => {
  const rec = (id: string, updatedAt: number, deletedAt: number | null = null, title = id) =>
    ({ id, title, createdAt: 0, updatedAt, deletedAt }) as never
  const data = (tasks: unknown[]) => ({ tasks, occurrences: [], notebooks: [], notes: [], settings: [] }) as never

  it('adds new, takes newer, keeps older-or-equal local, and spreads deletions', () => {
    const local = data([rec('a', 10), rec('b', 10), rec('c', 10), rec('d', 10)])
    const incoming = data([rec('a', 20, null, 'a2'), rec('b', 5), rec('c', 10), rec('d', 30, 30), rec('e', 1)])
    const { toPut, report } = mergeData(local, incoming)
    expect(toPut.tasks.map((t) => t.id)).toEqual(['a', 'd', 'e'])
    expect(report).toEqual({ added: 1, updated: 1, deleted: 1, unchanged: 2 })
  })
})

describe('importBackup', () => {
  it('restores everything into an empty database', async () => {
    const phone = createTestDb()
    await createTask(phone, { title: 'Sport', kind: 'daily', date: '2026-10-07' }, 1000)
    const book = await createNotebook(phone, { title: 'Ish', color: '#000' }, 1000)
    await createNote(phone, { notebookId: book.id, title: 'Yozuv' }, 1000)
    await updateSettings(phone, { theme: 'dark' }, 1000)

    const backup = await createBackup(phone, '0.6.0', 2000)
    expect(backupSummary(backup)).toEqual({ tasks: 1, notebooks: 1, notes: 1 })

    const fresh = createTestDb()
    const report = await importBackup(fresh, parseBackup(JSON.stringify(backup)))
    expect(report).toEqual({ added: 4, updated: 0, deleted: 0, unchanged: 0 })
    expect(await readAll(fresh)).toEqual(await readAll(phone))
  })

  it('importing the same file twice changes nothing the second time', async () => {
    const a = createTestDb()
    await createTask(a, { title: 'A', kind: 'general' }, 1000)
    const b = createTestDb()
    await transfer(a, b, 2000)
    expect(await transfer(a, b, 3000)).toEqual({ added: 0, updated: 0, deleted: 0, unchanged: 1 })
  })

  it('two devices that change separately end up the same after exchanging files', async () => {
    const phone = createTestDb()
    const pc = createTestDb()
    const shared = await createTask(phone, { title: 'Umumiy reja', kind: 'general' }, 1000)
    const old = await createTask(phone, { title: 'Eski', kind: 'general' }, 1000)
    await transfer(phone, pc, 1500)

    // Phone: complete the shared task and delete "Eski". PC: add a task and rename the shared one earlier.
    await updateTask(pc, shared.id, { title: 'Umumiy reja (PC)' }, 2000)
    await createTask(pc, { title: 'Kompyuterda', kind: 'general' }, 2100)
    await setTaskStatus(phone, shared.id, 'done', 3000)
    await softDelete(phone.tasks, old.id, 3100)

    await transfer(phone, pc, 4000)
    await transfer(pc, phone, 4100)

    expect(await titles(phone)).toEqual(['Kompyuterda', 'Umumiy reja'])
    expect(await titles(pc)).toEqual(await titles(phone))
    // The phone's later change (done) won over the PC's earlier rename.
    const onPc = (await getAllTasks(pc)).find((t) => t.id === shared.id)
    expect(onPc).toMatchObject({ status: 'done', title: 'Umumiy reja' })
  })

  it('merges the same recurring day checked on both devices without duplicates', async () => {
    const phone = createTestDb()
    const pc = createTestDb()
    const sport = await createTask(
      phone,
      { title: 'Sport', kind: 'daily', date: '2026-10-01', recurrence: { freq: 'daily', interval: 1 } },
      1000,
    )
    await transfer(phone, pc, 1500)
    await setOccurrenceStatus(pc, sport.id, '2026-10-05', 'skipped', 2000)
    await setOccurrenceStatus(phone, sport.id, '2026-10-05', 'done', 3000)

    await transfer(phone, pc, 4000)
    const day = await getOccurrence(pc, sport.id, '2026-10-05')
    expect(day?.status).toBe('done')
    const active = (await pc.occurrences.toArray()).filter((o) => o.deletedAt === null && o.date === '2026-10-05')
    expect(active).toHaveLength(1)

    await transfer(pc, phone, 4100)
    const onPhone = (await phone.occurrences.toArray()).filter((o) => o.deletedAt === null && o.date === '2026-10-05')
    expect(onPhone).toHaveLength(1)
    expect(onPhone[0].status).toBe('done')
  })

  it('deleting a notebook on one device removes it and its notes on the other', async () => {
    const phone = createTestDb()
    const pc = createTestDb()
    const book = await createNotebook(phone, { title: 'Ish', color: '#000' }, 1000)
    await createNote(phone, { notebookId: book.id, title: 'Yozuv' }, 1000)
    await transfer(phone, pc, 1500)
    const { deleteNotebook } = await import('../db/notebooks')
    await deleteNotebook(phone, book.id, 2000)
    const report = await transfer(phone, pc, 3000)
    expect(report.deleted).toBe(2)
    expect(await listAllNotes(pc)).toEqual([])
  })
})
