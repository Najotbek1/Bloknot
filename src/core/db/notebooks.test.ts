import { describe, expect, it } from 'vitest'
import {
  createNote,
  createNotebook,
  DEFAULT_NOTEBOOK_ID,
  deleteNote,
  deleteNotebook,
  ensureDefaultNotebook,
  getNotesForTask,
  isNoteEmpty,
  listAllNotes,
  listNotebooks,
  listNotes,
  updateNote,
  updateNotebook,
} from './notebooks'
import { createTestDb } from './testing'

describe('notebooks', () => {
  it('creates, renames and lists notebooks with note counts', async () => {
    const db = createTestDb()
    const work = await createNotebook(db, { title: ' Ish ', color: '#4f46e5' }, 1000)
    const home = await createNotebook(db, { title: 'Uy', color: '#16a34a' }, 2000)
    await createNote(db, { notebookId: work.id, title: 'A' }, 3000)
    await createNote(db, { notebookId: work.id, title: 'B' }, 4000)
    await updateNotebook(db, home.id, { title: 'Oila' }, 5000)

    const list = await listNotebooks(db)
    expect(list.map((s) => [s.notebook.title, s.noteCount, s.lastUpdated])).toEqual([
      ['Ish', 2, 4000],
      ['Oila', 0, 5000],
    ])
  })

  it('rejects an empty title', async () => {
    const db = createTestDb()
    await expect(createNotebook(db, { title: '  ', color: '#000' })).rejects.toThrow()
  })

  it('deleting a notebook hides it and its notes', async () => {
    const db = createTestDb()
    const work = await createNotebook(db, { title: 'Ish', color: '#000' })
    const other = await createNotebook(db, { title: 'Boshqa', color: '#000' })
    await createNote(db, { notebookId: work.id, title: 'Ketadi' })
    const kept = await createNote(db, { notebookId: other.id, title: 'Qoladi' })
    await deleteNotebook(db, work.id)

    expect((await listNotebooks(db)).map((s) => s.notebook.title)).toEqual(['Boshqa'])
    expect(await listAllNotes(db)).toEqual([kept])
    expect(await listNotes(db, work.id)).toEqual([])
  })

  it('keeps one default notebook and brings it back if deleted', async () => {
    const db = createTestDb()
    const first = await ensureDefaultNotebook(db, 'Umumiy', '#000')
    const second = await ensureDefaultNotebook(db, 'Umumiy', '#000')
    expect(second.id).toBe(first.id)
    expect(first.id).toBe(DEFAULT_NOTEBOOK_ID)

    await deleteNotebook(db, first.id)
    const restored = await ensureDefaultNotebook(db, 'Umumiy', '#000')
    expect(restored.deletedAt).toBeNull()
    expect(await listNotebooks(db)).toHaveLength(1)
  })
})

describe('notes', () => {
  it('lists notes newest first and links them to tasks', async () => {
    const db = createTestDb()
    const book = await createNotebook(db, { title: 'Ish', color: '#000' })
    const a = await createNote(db, { notebookId: book.id, title: 'A', taskId: 't1' }, 1000)
    const b = await createNote(db, { notebookId: book.id, title: 'B' }, 2000)
    await updateNote(db, a.id, { body: 'yangilandi' }, 3000)

    expect((await listNotes(db, book.id)).map((n) => n.title)).toEqual(['A', 'B'])
    expect((await getNotesForTask(db, 't1')).map((n) => n.id)).toEqual([a.id])

    await deleteNote(db, b.id)
    expect((await listNotes(db, book.id)).map((n) => n.title)).toEqual(['A'])
  })

  it('needs an existing notebook', async () => {
    const db = createTestDb()
    await expect(createNote(db, { notebookId: 'yo‘q' })).rejects.toThrow()
  })

  it('knows when a note is empty', () => {
    expect(isNoteEmpty({ title: ' ', body: '\n' })).toBe(true)
    expect(isNoteEmpty({ title: '', body: 'x' })).toBe(false)
  })
})
